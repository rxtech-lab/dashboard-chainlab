"use client";

import { NativeModal } from "@/context/NativeDialog";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "../../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../../ui/form";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import {
  createPoll,
  getPolls,
} from "@/app/(internal)/(protected)/(sidebar)/polls/actions";
import {
  getAdminSemesters,
  getAdminClasses,
} from "@/app/(internal)/(protected)/actions";
import { useToast } from "@/hooks/use-toast";
import { createPollSchema, type CreatePollFormValues } from "./poll.types";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useEffect } from "react";

export default function CreatePollDialog() {
  const [open, setOpen] = useState(false);

  const { data: semestersData } = useSWR(
    open ? "/api/semesters" : null,
    async () => {
      const res = await getAdminSemesters();
      return res.data;
    },
  );

  const semesters = semestersData ?? [];

  const form = useForm<CreatePollFormValues>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title: "",
      description: "",
      requireIdentification: false,
      semesterId: undefined,
      classId: undefined,
      questions: [
        {
          questionText: "",
          questionType: "SELECT",
          isRequired: true,
          options: [{ optionText: "" }, { optionText: "" }],
        },
      ],
    },
  });

  const selectedSemesterId = form.watch("semesterId");

  const { data: classesData } = useSWR(
    selectedSemesterId ? `/api/classes/${selectedSemesterId}` : null,
    async () => {
      const res = await getAdminClasses(selectedSemesterId!);
      return res.data;
    },
  );

  const classes = classesData ?? [];

  // Clear classId when semester changes
  useEffect(() => {
    if (!selectedSemesterId) {
      form.setValue("classId", undefined);
    }
  }, [selectedSemesterId, form]);

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: CreatePollFormValues) => {
    setLoading(true);
    const response = await createPoll(data).finally(() => {
      setLoading(false);
    });
    if (response.error) {
      toast.toast({
        title: "Error",
        description: response.error,
        variant: "destructive",
      });
    } else {
      toast.toast({
        title: "Success",
        description: "Poll created successfully",
        variant: "success",
      });
      form.reset();
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
        data-testid="create-poll-button"
      >
        <Plus className="h-4 w-4" /> Create new poll
      </Button>
      <NativeModal
        openModal={open}
        closeModal={() => setOpen(false)}
        className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create new poll
            </h1>
            <p className="text-sm text-gray-500">
              Create a poll with multiple question types
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter poll title"
                        {...field}
                        data-testid="poll-title-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter poll description"
                        {...field}
                        data-testid="poll-description-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requireIdentification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require Identification
                      </FormLabel>
                      <FormDescription>
                        Students must select their name from the attendant list
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="semesterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester (optional)</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value?.toString() ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? Number.parseInt(e.target.value)
                              : undefined,
                          )
                        }
                        disabled={semesters.length === 0}
                        data-testid="semester-select"
                      >
                        <option value="">
                          {semesters.length === 0
                            ? "No semesters available"
                            : "Select semester"}
                        </option>
                        {semesters.map((s) => (
                          <option key={s.id} value={s.id.toString()}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class (optional)</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value?.toString() ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? Number.parseInt(e.target.value)
                              : undefined,
                          )
                        }
                        disabled={!selectedSemesterId || classes.length === 0}
                        data-testid="class-select"
                      >
                        <option value="">
                          {!selectedSemesterId
                            ? "Select a semester first"
                            : classes.length === 0
                              ? "No classes available"
                              : "Select class"}
                        </option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id.toString()}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {selectedSemesterId && classes.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Create classes in the{" "}
                        <a
                          href="/classes"
                          className="underline hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push("/classes");
                            setOpen(false);
                          }}
                        >
                          Classes page
                        </a>{" "}
                        first
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Questions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendQuestion({
                        questionText: "",
                        questionType: "SELECT",
                        isRequired: true,
                        options: [{ optionText: "" }, { optionText: "" }],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Question
                  </Button>
                </div>

                {questionFields.map((question, questionIndex) => (
                  <QuestionField
                    key={question.id}
                    questionIndex={questionIndex}
                    form={form}
                    removeQuestion={removeQuestion}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  data-testid="confirm-button"
                >
                  Create Poll
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </NativeModal>
    </>
  );
}

function QuestionField({
  questionIndex,
  form,
  removeQuestion,
}: {
  questionIndex: number;
  form: any;
  removeQuestion: (index: number) => void;
}) {
  const questionType = form.watch(`questions.${questionIndex}.questionType`);

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control: form.control,
    name: `questions.${questionIndex}.options`,
  });

  const needsOptions =
    questionType === "SELECT" || questionType === "MULTIPLE_CHOICE";

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          <FormField
            control={form.control}
            name={`questions.${questionIndex}.questionText`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question {questionIndex + 1}</FormLabel>
                <FormControl>
                  <Input placeholder="Enter question" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`questions.${questionIndex}.questionType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...field}
                    >
                      <option value="SELECT">Single Choice</option>
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="TEXT">Text Response</option>
                      <option value="BOOLEAN">Yes/No</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`questions.${questionIndex}.isRequired`}
              render={({ field }) => (
                <FormItem className="flex flex-col justify-end">
                  <FormLabel className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    Required
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>

          {needsOptions && (
            <div className="space-y-2 pl-4 border-l-2 border-blue-200">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm">Options</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => appendOption({ optionText: "" })}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Option
                </Button>
              </div>

              {optionFields.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.options.${optionIndex}.optionText`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {optionFields.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(optionIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeQuestion(questionIndex)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
