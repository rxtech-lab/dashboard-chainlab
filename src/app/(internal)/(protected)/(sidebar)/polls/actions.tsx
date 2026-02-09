"use server";

import { Config } from "@/config/config";
import { getPollNonceKey } from "@/lib/poll.constants";
import { isAuthenticated } from "@/lib/auth";
import redis from "@/lib/redis";
import { db } from "@/lib/database";
import {
  poll,
  pollQuestion,
  pollQuestionOption,
  pollResponse,
} from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { eq, and, desc, count, sql } from "drizzle-orm";
import {
  createPollSchema,
  type CreatePollFormValues,
  type PollResultsData,
  type QuestionResult,
} from "@/components/pages/polls/poll.types";

// Custom error type for better error handling
type ActionResponse = {
  success: boolean;
  error?: string;
  data?: any;
};

/**
 * Creates a new poll with questions and options.
 * @param data The poll data with questions and options.
 * @returns The created poll.
 */
export async function createPoll(
  data: CreatePollFormValues,
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      return { success: false, error };
    }
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate the data
    const validation = createPollSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Invalid data",
      };
    }

    // Insert poll and questions in a transaction
    await db.transaction(async (tx) => {
      // Insert poll
      const [newPoll] = await tx
        .insert(poll)
        .values({
          title: data.title,
          description: data.description ?? null,
          requireIdentification: data.requireIdentification,
          createdBy: session.id,
          semesterId: data.semesterId ?? null,
          classId: data.classId ?? null,
        })
        .returning();

      // Insert questions and options
      for (let i = 0; i < data.questions.length; i++) {
        const question = data.questions[i];
        const [newQuestion] = await tx
          .insert(pollQuestion)
          .values({
            pollId: newPoll.id,
            questionText: question.questionText,
            questionType: question.questionType,
            isRequired: question.isRequired,
            sortOrder: question.sortOrder ?? i,
          })
          .returning();

        // Insert options for SELECT and MULTIPLE_CHOICE questions
        if (
          question.options &&
          (question.questionType === "SELECT" ||
            question.questionType === "MULTIPLE_CHOICE")
        ) {
          for (let j = 0; j < question.options.length; j++) {
            const option = question.options[j];
            await tx.insert(pollQuestionOption).values({
              questionId: newQuestion.id,
              optionText: option.optionText,
              sortOrder: option.sortOrder ?? j,
            });
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDbError(error),
    };
  }
}

/**
 * Get paginated list of polls for the current user.
 * @param page The page number.
 * @param limit The number of polls per page.
 * @returns The polls and total pages.
 */
export async function getPolls(page: number, limit: number) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      throw new Error(error);
    }
    if (!session) {
      throw new Error("Unauthorized");
    }

    const offset = (page - 1) * limit;

    const [polls, totalCountResult] = await Promise.all([
      db.query.poll.findMany({
        where: eq(poll.createdBy, session.id),
        orderBy: [desc(poll.createdAt), desc(poll.id)],
        offset,
        limit,
        with: {
          semester: {
            columns: { id: true, name: true },
          },
          classItem: {
            columns: { id: true, name: true },
          },
          questions: {
            columns: { id: true },
          },
        },
      }),
      db
        .select({ count: count() })
        .from(poll)
        .where(eq(poll.createdBy, session.id)),
    ]);

    const totalCount = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: polls,
      totalPages,
    };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

/**
 * Get a single poll with questions and options.
 * @param id The poll id.
 * @returns The poll data.
 */
export async function getPoll(id: number) {
  try {
    const cookieStore = await cookies();
    const { error, session } = await isAuthenticated(cookieStore);

    if (error) {
      return { error: error };
    }

    const data = await db.query.poll.findFirst({
      where: and(eq(poll.id, id), eq(poll.createdBy, session!.id)),
      with: {
        semester: {
          columns: { id: true, name: true },
        },
        classItem: {
          columns: { id: true, name: true },
        },
        questions: {
          orderBy: [desc(pollQuestion.sortOrder)],
          with: {
            options: {
              orderBy: [desc(pollQuestionOption.sortOrder)],
            },
          },
        },
      },
    });

    if (!data) {
      return { error: "Poll not found" };
    }

    return { data };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

/**
 * Update a poll's open/closed status.
 * @param id The poll id.
 * @param isOpen Whether the poll is open or closed.
 * @returns Success response.
 */
export async function updatePoll(
  id: number,
  data: { isOpen: boolean },
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      return { success: false, error };
    }
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check ownership
    const existingPoll = await db.query.poll.findFirst({
      where: and(eq(poll.id, id), eq(poll.createdBy, session.id)),
    });

    if (!existingPoll) {
      return { success: false, error: "Poll not found" };
    }

    await db.update(poll).set({ isOpen: data.isOpen }).where(eq(poll.id, id));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDbError(error),
    };
  }
}

/**
 * Update poll details including title, description, and questions.
 * @param id The poll id.
 * @param data The updated poll data.
 * @returns Success response.
 */
export async function updatePollDetails(
  id: number,
  data: CreatePollFormValues,
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      return { success: false, error };
    }
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate the data
    const validation = createPollSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Invalid data",
      };
    }

    // Check ownership
    const existingPoll = await db.query.poll.findFirst({
      where: and(eq(poll.id, id), eq(poll.createdBy, session.id)),
    });

    if (!existingPoll) {
      return { success: false, error: "Poll not found" };
    }

    // Update poll and recreate questions in a transaction
    await db.transaction(async (tx) => {
      // Update poll basic info
      await tx
        .update(poll)
        .set({
          title: data.title,
          description: data.description ?? null,
          requireIdentification: data.requireIdentification,
          semesterId: data.semesterId ?? null,
          classId: data.classId ?? null,
        })
        .where(eq(poll.id, id));

      // Delete existing questions (cascade will delete options and responses)
      await tx.delete(pollQuestion).where(eq(pollQuestion.pollId, id));

      // Insert new questions and options
      for (let i = 0; i < data.questions.length; i++) {
        const question = data.questions[i];
        const [newQuestion] = await tx
          .insert(pollQuestion)
          .values({
            pollId: id,
            questionText: question.questionText,
            questionType: question.questionType,
            isRequired: question.isRequired,
            sortOrder: question.sortOrder ?? i,
          })
          .returning();

        // Insert options for SELECT and MULTIPLE_CHOICE questions
        if (
          question.options &&
          (question.questionType === "SELECT" ||
            question.questionType === "MULTIPLE_CHOICE")
        ) {
          for (let j = 0; j < question.options.length; j++) {
            const option = question.options[j];
            await tx.insert(pollQuestionOption).values({
              questionId: newQuestion.id,
              optionText: option.optionText,
              sortOrder: option.sortOrder ?? j,
            });
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDbError(error),
    };
  }
}

/**
 * Delete a poll.
 * @param id The poll id.
 * @returns Success response.
 */
export async function deletePoll(id: number): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      return { success: false, error };
    }
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check ownership
    const existingPoll = await db.query.poll.findFirst({
      where: and(eq(poll.id, id), eq(poll.createdBy, session.id)),
    });

    if (!existingPoll) {
      return { success: false, error: "Poll not found" };
    }

    await db.delete(poll).where(eq(poll.id, id));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDbError(error),
    };
  }
}

/**
 * Generate a nonce and return a url and expiration time for the poll
 * @param id - The id of the poll
 * @returns - The url for the poll
 */
export async function generatePollUrl(id: number) {
  try {
    const cookieStore = await cookies();
    const { error, session } = await isAuthenticated(cookieStore);

    if (error) {
      return { error: error };
    }

    // check if the nonce is already set
    const key = getPollNonceKey(id);
    let nonce = await redis.get(key);
    if (nonce) {
      const remainingTime = await redis.ttl(key);
      const expirationTime = new Date(Date.now() + remainingTime * 1000);
      return {
        url: `/poll/${id}/respond?nonce=${nonce}`,
        exp: expirationTime.toISOString(),
      };
    }

    const data = await db.query.poll.findFirst({
      where: and(eq(poll.id, id), eq(poll.createdBy, session!.id)),
    });

    if (!data) {
      return { error: "Poll not found" };
    }

    nonce = uuidv4();
    const expirationTime = new Date(
      Date.now() + Config.Poll.nonceExpiration * 1000,
    );

    await redis.set(key, nonce, {
      ex: Config.Poll.nonceExpiration,
    });

    return {
      url: `/poll/${id}/respond?nonce=${nonce}`,
      exp: expirationTime.toISOString(),
    };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

/**
 * Refresh the nonce for a poll
 * @param id - The id of the poll
 * @returns - The new url and expiration time
 */
export async function refreshPollNonce(id: number) {
  try {
    const cookieStore = await cookies();
    const { error } = await isAuthenticated(cookieStore);

    if (error) {
      return { error: error };
    }

    const key = getPollNonceKey(id);
    const nonce = uuidv4();
    const expirationTime = new Date(
      Date.now() + Config.Poll.nonceExpiration * 1000,
    );

    await redis.set(key, nonce, {
      ex: Config.Poll.nonceExpiration,
    });

    return {
      url: `/poll/${id}/respond?nonce=${nonce}`,
      exp: expirationTime.toISOString(),
    };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

/**
 * Get aggregated poll results
 * @param id - The poll id
 * @returns Aggregated results by question
 */
export async function getPollResults(id: number) {
  try {
    const cookieStore = await cookies();
    const { error, session } = await isAuthenticated(cookieStore);

    if (error) {
      return { error: error };
    }

    // Check ownership
    const pollData = await db.query.poll.findFirst({
      where: and(eq(poll.id, id), eq(poll.createdBy, session!.id)),
      with: {
        questions: {
          orderBy: [desc(pollQuestion.sortOrder)],
          with: {
            options: {
              orderBy: [desc(pollQuestionOption.sortOrder)],
            },
          },
        },
      },
    });

    if (!pollData) {
      return { error: "Poll not found" };
    }

    // Get all responses
    const responses = await db.query.pollResponse.findMany({
      where: eq(pollResponse.pollId, id),
      with: {
        selectedOption: true,
      },
    });

    // Count unique respondents
    const uniqueRespondents = new Set(responses.map((r) => r.respondentId));
    const totalRespondents = uniqueRespondents.size;

    // Aggregate results by question
    const questions: QuestionResult[] = [];

    for (const question of pollData.questions) {
      const questionResponses = responses.filter(
        (r) => r.questionId === question.id,
      );
      const totalResponses = new Set(
        questionResponses.map((r) => r.respondentId),
      ).size;

      let results: any;

      if (question.questionType === "SELECT") {
        // Count responses per option
        const optionCounts = new Map<number, number>();
        question.options.forEach((opt) => optionCounts.set(opt.id, 0));

        questionResponses.forEach((response) => {
          if (response.selectedOptionId) {
            const current = optionCounts.get(response.selectedOptionId) || 0;
            optionCounts.set(response.selectedOptionId, current + 1);
          }
        });

        results = question.options.map((option) => {
          const count = optionCounts.get(option.id) || 0;
          return {
            optionId: option.id,
            optionText: option.optionText,
            count,
            percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
          };
        });
      } else if (question.questionType === "MULTIPLE_CHOICE") {
        // Count responses per option (multiple selections possible)
        const optionCounts = new Map<number, number>();
        question.options.forEach((opt) => optionCounts.set(opt.id, 0));

        questionResponses.forEach((response) => {
          if (response.selectedOptionId) {
            const current = optionCounts.get(response.selectedOptionId) || 0;
            optionCounts.set(response.selectedOptionId, current + 1);
          }
        });

        results = question.options.map((option) => {
          const count = optionCounts.get(option.id) || 0;
          return {
            optionId: option.id,
            optionText: option.optionText,
            count,
            percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
          };
        });
      } else if (question.questionType === "TEXT") {
        // List all text responses
        results = questionResponses.map((response) => ({
          answerId: response.id,
          answerText: response.answerText || "",
          createdAt: response.createdAt,
        }));
      } else if (question.questionType === "BOOLEAN") {
        // Count true/false responses
        let trueCount = 0;
        let falseCount = 0;

        questionResponses.forEach((response) => {
          if (response.answerText === "true") {
            trueCount++;
          } else if (response.answerText === "false") {
            falseCount++;
          }
        });

        const total = trueCount + falseCount;
        results = {
          trueCount,
          falseCount,
          truePercentage: total > 0 ? (trueCount / total) * 100 : 0,
          falsePercentage: total > 0 ? (falseCount / total) * 100 : 0,
        };
      }

      questions.push({
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        totalResponses,
        results,
      });
    }

    const resultsData: PollResultsData = {
      pollId: id,
      totalRespondents,
      questions,
    };

    return { data: resultsData };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}
