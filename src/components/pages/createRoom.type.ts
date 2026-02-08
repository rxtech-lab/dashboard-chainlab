import { z } from "zod";

export const formSchema = z.object({
  alias: z.string().min(2, {
    message: "Room ID must be at least 2 characters.",
  }),
  semesterId: z.number().optional(),
  classId: z.number().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
