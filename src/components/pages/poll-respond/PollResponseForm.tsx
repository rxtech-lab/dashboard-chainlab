"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pollResponseSchema, type PollResponseFormValues } from "../poll.types";
import { submitPollResponse } from "@/app/(public)/poll/[id]/respond/actions";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/ui/spinner";

interface PollResponseFormProps {
  pollId: number;
  nonce: string;
  poll: {
    id: number;
    title: string;
    description?: string | null;
    requireIdentification: boolean;
    questions: {
      id: number;
      questionText: string;
      questionType: "SELECT" | "MULTIPLE_CHOICE" | "TEXT" | "BOOLEAN";
      isRequired: boolean;
      options?: {
        id: number;
        optionText: string;
      }[];
    }[];
  };
  attendants?: {
    id: number;
    firstName: string;
    lastName: string;
    userId: string;
  }[];
  onSuccess: () => void;
}

export default function PollResponseForm({
  pollId,
  nonce,
  poll,
  attendants,
  onSuccess,
}: PollResponseFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAttendantId, setSelectedAttendantId] = useState<
    number | undefined
  >();
  const toast = useToast();

  const form = useForm<any>({
    defaultValues: {
      ...poll.questions.reduce((acc, question) => {
        if (question.questionType === "MULTIPLE_CHOICE") {
          acc[`question_${question.id}`] = [];
        } else {
          acc[`question_${question.id}`] = "";
        }
        return acc;
      }, {} as any),
    },
  });

  const onSubmit = async (data: any) => {
    if (poll.requireIdentification && !selectedAttendantId) {
      toast.toast({
        title: "Error",
        description: "Please select your name from the list",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Transform form data to API format
    const responses = poll.questions.map((question) => {
      const value = data[`question_${question.id}`];

      if (question.questionType === "SELECT") {
        return {
          questionId: question.id,
          selectedOptionIds: value ? [Number(value)] : [],
        };
      } else if (question.questionType === "MULTIPLE_CHOICE") {
        return {
          questionId: question.id,
          selectedOptionIds: Array.isArray(value) ? value.map(Number) : [],
        };
      } else if (question.questionType === "BOOLEAN") {
        return {
          questionId: question.id,
          answerText: value,
        };
      } else {
        // TEXT
        return {
          questionId: question.id,
          answerText: value || "",
        };
      }
    });

    const result = await submitPollResponse(
      pollId,
      nonce,
      responses,
      selectedAttendantId,
    ).finally(() => {
      setLoading(false);
    });

    if (result.error) {
      toast.toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast.toast({
        title: "Success",
        description: "Your response has been submitted!",
        variant: "success",
      });
      onSuccess();
    }
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-600 mt-2">{poll.description}</p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {poll.requireIdentification && attendants && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <FormLabel className="text-base font-semibold mb-3 block">
                  Select Your Name *
                </FormLabel>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value={selectedAttendantId?.toString() ?? ""}
                  onChange={(e) =>
                    setSelectedAttendantId(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  required
                >
                  <option value="">Select your name...</option>
                  {attendants.map((attendant) => (
                    <option key={attendant.id} value={attendant.id}>
                      {attendant.firstName} {attendant.lastName} (
                      {attendant.userId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {poll.questions.map((question, index) => (
              <div
                key={question.id}
                className="border rounded-lg p-4 bg-gray-50"
              >
                <h3 className="font-medium text-gray-900 mb-4">
                  {index + 1}. {question.questionText}
                  {question.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </h3>

                {question.questionType === "SELECT" && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            {question.options?.map((option) => (
                              <label
                                key={option.id}
                                className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded"
                              >
                                <input
                                  type="radio"
                                  value={option.id}
                                  checked={field.value === option.id.toString()}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  className="h-4 w-4"
                                  required={question.isRequired}
                                />
                                <span>{option.optionText}</span>
                              </label>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {question.questionType === "MULTIPLE_CHOICE" && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            {question.options?.map((option) => (
                              <label
                                key={option.id}
                                className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  value={option.id}
                                  checked={field.value?.includes(
                                    option.id.toString(),
                                  )}
                                  onChange={(e) => {
                                    const currentValue = field.value || [];
                                    const newValue = e.target.checked
                                      ? [...currentValue, option.id.toString()]
                                      : currentValue.filter(
                                          (v: string) =>
                                            v !== option.id.toString(),
                                        );
                                    field.onChange(newValue);
                                  }}
                                  className="h-4 w-4"
                                />
                                <span>{option.optionText}</span>
                              </label>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {question.questionType === "TEXT" && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your response..."
                            {...field}
                            required={question.isRequired}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {question.questionType === "BOOLEAN" && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                              <input
                                type="radio"
                                value="true"
                                checked={field.value === "true"}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="h-4 w-4"
                                required={question.isRequired}
                              />
                              <span>Yes</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                              <input
                                type="radio"
                                value="false"
                                checked={field.value === "false"}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="h-4 w-4"
                                required={question.isRequired}
                              />
                              <span>No</span>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={loading}
                size="lg"
                className="w-full md:w-auto"
              >
                Submit Response
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}
