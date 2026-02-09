"use client";

import { NativeModal } from "@/context/NativeDialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClass } from "@/app/(internal)/(protected)/(sidebar)/classes/actions";
import { getAdminSemesters } from "@/app/(internal)/(protected)/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  semesterId: z.number({ message: "Please select a semester" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateClassDialog({
  semesterId,
}: {
  semesterId?: number;
}) {
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
    defaultValues: { name: "", semesterId: semesterId || undefined },
  });
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const response = await createClass({
      name: data.name,
      semesterId: data.semesterId,
    }).finally(() => {
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
        description: "Class created successfully",
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
        data-testid="create-class-button"
      >
        <Plus className="h-4 w-4" /> Create new class
      </Button>
      <NativeModal
        openModal={open}
        closeModal={() => setOpen(false)}
        className="rounded-2xl w-[500px]"
      >
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create new class
            </h1>
            <p className="text-sm text-gray-500">
              Enter a name and select a semester for the new class
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. CS101"
                        {...field}
                        data-testid="class-name-input"
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
                    <FormLabel>Semester</FormLabel>
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
                  data-testid="class-confirm-button"
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
