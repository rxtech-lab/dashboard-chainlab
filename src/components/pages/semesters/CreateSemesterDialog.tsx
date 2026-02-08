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
import { createSemester } from "@/app/(internal)/(protected)/(sidebar)/semesters/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateSemesterDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const response = await createSemester(data).finally(() => {
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
        description: "Semester created successfully",
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
        data-testid="create-semester-button"
      >
        <Plus className="h-4 w-4" /> Create semester
      </Button>
      <NativeModal
        openModal={open}
        closeModal={() => setOpen(false)}
        className="rounded-2xl w-[500px]"
      >
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create new semester
            </h1>
            <p className="text-sm text-gray-500">
              Enter a name for the new semester
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
                        placeholder="e.g. Fall 2025"
                        {...field}
                        data-testid="semester-name-input"
                      />
                    </FormControl>
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
                  data-testid="semester-confirm-button"
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
