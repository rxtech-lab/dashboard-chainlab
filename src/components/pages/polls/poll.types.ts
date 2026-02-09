import { z } from "zod";

// Question type enum
export const QuestionType = {
  SELECT: "SELECT",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TEXT: "TEXT",
  BOOLEAN: "BOOLEAN",
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

// Option schema for SELECT and MULTIPLE_CHOICE questions
export const pollOptionSchema = z.object({
  optionText: z.string().min(1, "Option text is required"),
  sortOrder: z.number().optional(),
});

// Question schema
export const pollQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum(["SELECT", "MULTIPLE_CHOICE", "TEXT", "BOOLEAN"]),
  isRequired: z.boolean(),
  sortOrder: z.number().optional(),
  options: z.array(pollOptionSchema).optional(),
});

// Create poll schema with refinement for option validation
export const createPollSchema = z
  .object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().optional(),
    requireIdentification: z.boolean(),
    semesterId: z.number().optional(),
    classId: z.number().optional(),
    questions: z
      .array(pollQuestionSchema)
      .min(1, "At least one question is required"),
  })
  .refine(
    (data) => {
      // Validate that SELECT and MULTIPLE_CHOICE questions have at least 2 options
      return data.questions.every((question) => {
        if (
          question.questionType === "SELECT" ||
          question.questionType === "MULTIPLE_CHOICE"
        ) {
          return question.options && question.options.length >= 2;
        }
        return true;
      });
    },
    {
      message:
        "SELECT and MULTIPLE_CHOICE questions must have at least 2 options",
      path: ["questions"],
    },
  );

export type CreatePollFormValues = z.infer<typeof createPollSchema>;

// Update poll schema (for editing)
export const updatePollSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").optional(),
  description: z.string().optional(),
  isOpen: z.boolean().optional(),
});

export type UpdatePollFormValues = z.infer<typeof updatePollSchema>;

// Response schema for individual answer
export const pollAnswerSchema = z.object({
  questionId: z.number(),
  answerText: z.string().optional(),
  selectedOptionIds: z.array(z.number()).optional(),
});

// Submit response schema
export const pollResponseSchema = z.object({
  responses: z
    .array(pollAnswerSchema)
    .min(1, "At least one answer is required"),
  attendantId: z.number().optional(), // Only for identified polls
});

export type PollResponseFormValues = z.infer<typeof pollResponseSchema>;

// Types for poll results aggregation
export interface PollResultsData {
  pollId: number;
  totalRespondents: number;
  questions: QuestionResult[];
}

export interface QuestionResult {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  totalResponses: number;
  results:
    | SelectResult[]
    | MultipleChoiceResult[]
    | TextResult[]
    | BooleanResult;
}

export interface SelectResult {
  optionId: number;
  optionText: string;
  count: number;
  percentage: number;
}

export interface MultipleChoiceResult {
  optionId: number;
  optionText: string;
  count: number;
  percentage: number;
}

export interface TextResult {
  answerId: number;
  answerText: string;
  createdAt: string;
}

export interface BooleanResult {
  trueCount: number;
  falseCount: number;
  truePercentage: number;
  falsePercentage: number;
}
