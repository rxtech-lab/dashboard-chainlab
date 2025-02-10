"use client";

import { NativeModal } from "@/context/NativeDialog";
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
import { updateAttendanceRoomName } from "@/app/(protected)/actions";
import { useToast } from "@/hooks/use-toast";
import { formSchema, FormValues } from "./createRoom.type";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

interface UpdateRoomDialogProps {
  roomId: number;
  currentAlias: string;
}

export default function UpdateRoomDialog({ roomId, currentAlias }: UpdateRoomDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      alias: currentAlias,
    },
  });

  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const response = await updateAttendanceRoomName(roomId, data).finally(() => {
      setLoading(false);
    });
    if (response.error) {
      toast.toast({
        title: "Error",
        description: response.error,
      });
    } else {
      toast.toast({
        title: "Success",
        description: "Room updated successfully",
      });
      form.reset({ alias: data.alias });
      router.refresh();
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
        aria-label="Edit room"
      >
        <Pencil className="h-5 w-5" />
      </button>
      <NativeModal
        openModal={open}
        closeModal={() => setOpen(false)}
        className="rounded-2xl w-[500px]"
      >
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Update room name
            </h1>
            <p className="text-sm text-gray-500">
              Please enter the new name for the room
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter new name" {...field} />
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
                <Button type="submit" loading={loading}>
                  Update
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </NativeModal>
    </>
  );
} 