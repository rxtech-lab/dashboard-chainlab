"use client";

import { NativeModal } from "@/context/NativeDialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  createAttendanceRoom,
  getAdminSemesters,
  getAdminClasses,
} from "@/app/(internal)/(protected)/actions";
import { useToast } from "@/hooks/use-toast";
import { formSchema, FormValues } from "./createRoom.type";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useEffect } from "react";

export default function CreateRoomDialog() {
  const [open, setOpen] = useState(false);

  const { data: semestersData } = useSWR(
    open ? "/api/semesters" : null,
    async () => {
      const res = await getAdminSemesters();
      return res.data;
    },
  );

  const semesters = semestersData ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      alias: "",
      semesterId: undefined,
      classId: undefined,
    },
  });

  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const response = await createAttendanceRoom(data).finally(() => {
      router.refresh();
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
        description: "Room created successfully",
        variant: "success",
      });
      form.reset();
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
        data-testid="create-room-button"
      >
        <Plus className="h-4 w-4" /> Create new attendance room
      </Button>
      <NativeModal
        openModal={open}
        closeModal={() => setOpen(false)}
        className="rounded-2xl w-125!"
      >
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create new room for attendance
            </h1>
            <p className="text-sm text-gray-500">
              Please enter the attendance alias for the event
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter alias"
                        {...field}
                        data-testid="create-room-input"
                      />
                    </FormControl>
                    <FormMessage />
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
                    {semesters.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Create semesters in the{" "}
                        <a
                          href="/semesters"
                          className="underline hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push("/semesters");
                            setOpen(false);
                          }}
                        >
                          Semesters page
                        </a>{" "}
                        first
                      </p>
                    )}
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
                  Create
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </NativeModal>
    </>
  );
}
