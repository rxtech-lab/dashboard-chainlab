"use client";

import { NativeModal } from "@/context/NativeDialog";
import { Plus, Check, ChevronsUpDown, X } from "lucide-react";
import { useState, useEffect } from "react";
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
import {
  createStudent,
  updateStudent,
} from "@/app/(internal)/(protected)/(sidebar)/students/actions";
import { getAllClasses } from "@/app/(internal)/(protected)/(sidebar)/classes/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Combobox } from "@headlessui/react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  uid: z.string().min(1, { message: "Student ID is required." }),
  email: z
    .string()
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")),
  walletAddress: z.string().optional().or(z.literal("")),
  classIds: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type StudentData = {
  id: number;
  firstName: string;
  lastName: string;
  uid: string;
  email?: string | null;
  walletAddress?: string | null;
  studentClasses?: Array<{
    classItem: { id: number; name: string } | null;
  }>;
};

type Props = {
  editMode?: boolean;
  studentData?: StudentData;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function CreateStudentDialog({
  editMode = false,
  studentData,
  isOpen: controlledOpen,
  onClose,
}: Props = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (value: boolean) => {
        if (!value && onClose) onClose();
      }
    : setInternalOpen;

  const { data: classesData } = useSWR(
    open ? "/api/classes/all" : null,
    async () => {
      const res = await getAllClasses();
      return res.data;
    },
  );

  const classes = classesData ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      uid: "",
      email: "",
      walletAddress: "",
      classIds: [],
    },
  });

  // Update form when studentData changes (for edit mode)
  useEffect(() => {
    if (editMode && studentData && open) {
      form.reset({
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        uid: studentData.uid,
        email: studentData.email || "",
        walletAddress: studentData.walletAddress || "",
        classIds:
          studentData.studentClasses
            ?.filter(
              (sc): sc is { classItem: { id: number; name: string } } =>
                sc.classItem !== null,
            )
            .map((sc) => sc.classItem.id) || [],
      });
    } else if (!editMode && open) {
      form.reset({
        firstName: "",
        lastName: "",
        uid: "",
        email: "",
        walletAddress: "",
        classIds: [],
      });
    }
  }, [editMode, studentData, open, form]);

  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const response =
      editMode && studentData
        ? await updateStudent(studentData.id, data).finally(() => {
            router.refresh();
            setLoading(false);
          })
        : await createStudent(data).finally(() => {
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
        description: editMode
          ? "Student updated successfully"
          : "Student created successfully",
        variant: "success",
      });
      form.reset();
      setOpen(false);
    }
  };

  return (
    <>
      {!editMode && (
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2"
          data-testid="create-student-button"
        >
          <Plus className="h-4 w-4" /> Create student
        </Button>
      )}
      <NativeModal
        openModal={open}
        closeModal={() => setOpen(false)}
        className="rounded-2xl w-125!"
      >
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {editMode ? "Edit student" : "Create new student"}
            </h1>
            <p className="text-sm text-gray-500">
              {editMode
                ? "Update the student's details"
                : "Enter the student's details"}
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="First name"
                        {...field}
                        data-testid="student-firstname-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Last name"
                        {...field}
                        data-testid="student-lastname-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="uid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Student ID"
                        {...field}
                        data-testid="student-uid-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="student@example.com"
                        {...field}
                        data-testid="student-email-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0x..."
                        {...field}
                        data-testid="student-wallet-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classIds"
                render={({ field }) => {
                  const selectedClasses = classes.filter((c) =>
                    field.value?.includes(c.id),
                  );
                  const [query, setQuery] = useState("");
                  const filteredClasses =
                    query === ""
                      ? classes
                      : classes.filter((c) =>
                          c.name.toLowerCase().includes(query.toLowerCase()),
                        );

                  return (
                    <FormItem>
                      <FormLabel>Classes (optional)</FormLabel>
                      {classes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No classes available. Create classes in the{" "}
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
                          first.
                        </p>
                      ) : (
                        <Combobox
                          value={field.value ?? []}
                          onChange={field.onChange}
                          multiple
                        >
                          <div className="relative">
                            <div className="relative w-full">
                              <Combobox.Input
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                displayValue={() =>
                                  selectedClasses.length > 0
                                    ? `${selectedClasses.length} selected`
                                    : "Select classes..."
                                }
                                onChange={(event) =>
                                  setQuery(event.target.value)
                                }
                                placeholder="Select classes..."
                              />
                              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              </Combobox.Button>
                            </div>
                            {selectedClasses.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {selectedClasses.map((classItem) => (
                                  <div
                                    key={classItem.id}
                                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                                  >
                                    <span>
                                      {classItem.name} (
                                      {classItem.semester?.name})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        field.onChange(
                                          field.value?.filter(
                                            (id) => id !== classItem.id,
                                          ) ?? [],
                                        );
                                      }}
                                      className="hover:bg-secondary-foreground/20 rounded-sm p-0.5"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {filteredClasses.length === 0 && query !== "" ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-muted-foreground">
                                  Nothing found.
                                </div>
                              ) : (
                                filteredClasses.map((classItem) => (
                                  <Combobox.Option
                                    key={classItem.id}
                                    value={classItem.id}
                                    className={({ active }) =>
                                      cn(
                                        "relative cursor-pointer select-none py-2 pl-10 pr-4",
                                        active
                                          ? "bg-accent text-accent-foreground"
                                          : "text-foreground",
                                      )
                                    }
                                  >
                                    {({ selected }) => (
                                      <>
                                        <span
                                          className={cn(
                                            "block truncate",
                                            selected
                                              ? "font-medium"
                                              : "font-normal",
                                          )}
                                        >
                                          {classItem.name} (
                                          {classItem.semester?.name})
                                        </span>
                                        {selected && (
                                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent-foreground">
                                            <Check className="h-4 w-4" />
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </Combobox.Option>
                                ))
                              )}
                            </Combobox.Options>
                          </div>
                        </Combobox>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                  data-testid="student-confirm-button"
                >
                  {editMode ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </NativeModal>
    </>
  );
}
