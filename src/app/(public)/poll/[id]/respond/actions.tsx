"use server";

import {
  getPollNonceKey,
  POLL_RESPONDENT_COOKIE_NAME,
} from "@/lib/poll.constants";
import redis from "@/lib/redis";
import { db } from "@/lib/database";
import {
  poll,
  pollQuestion,
  pollQuestionOption,
  pollResponse,
  attendant,
} from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { eq, and, sql } from "drizzle-orm";
import type {
  PollResultsData,
  QuestionResult,
} from "@/components/pages/polls/poll.types";

/**
 * Get poll data for responding (validates nonce)
 */
export async function getPollForResponding(pollId: number, nonce: string) {
  try {
    // Validate nonce
    const key = getPollNonceKey(pollId);
    const storedNonce = await redis.get(key);

    if (!storedNonce || storedNonce !== nonce) {
      return {
        error: "Invalid or expired link. Please scan the QR code again.",
      };
    }

    // Fetch poll with questions and options
    const pollData = await db.query.poll.findFirst({
      where: eq(poll.id, pollId),
      with: {
        questions: {
          orderBy: [sql`${pollQuestion.sortOrder} ASC`],
          with: {
            options: {
              orderBy: [sql`${pollQuestionOption.sortOrder} ASC`],
            },
          },
        },
      },
    });

    if (!pollData) {
      return { error: "Poll not found" };
    }

    if (!pollData.isOpen) {
      return { error: "This poll is currently closed" };
    }

    return { data: pollData };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

/**
 * Get all attendants for identified polls
 */
export async function getAllAttendant(pollId: number) {
  try {
    // Find the poll to get the creator (admin)
    const pollData = await db.query.poll.findFirst({
      where: eq(poll.id, pollId),
    });

    if (!pollData) {
      return { data: [] };
    }

    const attendants = await db.query.attendant.findMany({
      where: eq(attendant.admin, pollData.createdBy),
      columns: {
        id: true,
        uid: true,
        firstName: true,
        lastName: true,
      },
    });

    const data = attendants.map((a) => ({
      userId: a.uid,
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
    }));

    return { data };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

/**
 * Check if respondent has already submitted
 */
export async function hasRespondedToPoll(pollId: number) {
  try {
    const cookieStore = await cookies();
    const respondentCookie = cookieStore.get(
      `${POLL_RESPONDENT_COOKIE_NAME}-${pollId}`,
    );

    if (respondentCookie) {
      return { data: true, respondentId: respondentCookie.value };
    }

    return { data: false };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

/**
 * Submit poll responses
 */
export async function submitPollResponse(
  pollId: number,
  nonce: string,
  responses: Array<{
    questionId: number;
    answerText?: string;
    selectedOptionIds?: number[];
  }>,
  attendantId?: number,
) {
  try {
    // Validate nonce
    const key = getPollNonceKey(pollId);
    const storedNonce = await redis.get(key);

    if (!storedNonce || storedNonce !== nonce) {
      return {
        error: "Invalid or expired link. Please scan the QR code again.",
      };
    }

    // Check if poll is open
    const pollData = await db.query.poll.findFirst({
      where: eq(poll.id, pollId),
    });

    if (!pollData) {
      return { error: "Poll not found" };
    }

    if (!pollData.isOpen) {
      return { error: "This poll is currently closed" };
    }

    // Check if already responded
    const cookieStore = await cookies();
    const respondentCookie = cookieStore.get(
      `${POLL_RESPONDENT_COOKIE_NAME}-${pollId}`,
    );

    if (respondentCookie) {
      return { error: "You have already responded to this poll" };
    }

    // Generate respondent ID
    const respondentId =
      pollData.requireIdentification && attendantId
        ? `attendant-${attendantId}`
        : uuidv4();

    // If identified poll, validate attendant exists
    if (pollData.requireIdentification) {
      if (!attendantId) {
        return { error: "Please select your name from the list" };
      }

      const attendantData = await db.query.attendant.findFirst({
        where: and(
          eq(attendant.id, attendantId),
          eq(attendant.admin, pollData.createdBy),
        ),
      });

      if (!attendantData) {
        return { error: "Invalid attendant selection" };
      }

      // Check if this attendant already responded
      const existingResponse = await db.query.pollResponse.findFirst({
        where: and(
          eq(pollResponse.pollId, pollId),
          eq(pollResponse.respondentId, `attendant-${attendantId}`),
        ),
      });

      if (existingResponse) {
        return { error: "You have already responded to this poll" };
      }
    }

    // Insert responses in transaction
    await db.transaction(async (tx) => {
      for (const response of responses) {
        if (
          response.selectedOptionIds &&
          response.selectedOptionIds.length > 0
        ) {
          // For SELECT and MULTIPLE_CHOICE - insert one row per selected option
          for (const optionId of response.selectedOptionIds) {
            await tx.insert(pollResponse).values({
              pollId,
              questionId: response.questionId,
              respondentId,
              selectedOptionId: optionId,
              answerText: null,
            });
          }
        } else if (response.answerText !== undefined) {
          // For TEXT and BOOLEAN - insert text answer
          await tx.insert(pollResponse).values({
            pollId,
            questionId: response.questionId,
            respondentId,
            answerText: response.answerText,
            selectedOptionId: null,
          });
        }
      }
    });

    // Set cookie to prevent re-submission
    cookieStore.set(`${POLL_RESPONDENT_COOKIE_NAME}-${pollId}`, respondentId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return { success: true, respondentId };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

/**
 * Get poll results (public, after submission)
 */
export async function getPollResultsPublic(pollId: number) {
  try {
    // Fetch poll with questions and options
    const pollData = await db.query.poll.findFirst({
      where: eq(poll.id, pollId),
      with: {
        questions: {
          orderBy: [sql`${pollQuestion.sortOrder} ASC`],
          with: {
            options: {
              orderBy: [sql`${pollQuestionOption.sortOrder} ASC`],
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
      where: eq(pollResponse.pollId, pollId),
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
        // Don't show individual text responses in public view for privacy
        results = [];
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
      pollId,
      totalRespondents,
      questions,
    };

    return { data: resultsData };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}
