"use client";

import { NativeModal } from "@/context/NativeDialog";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "../ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../ui/input-otp";

function generateRandomString(length: number) {
  return uuidv4().replace(/-/g, "").slice(0, length);
}

export default function CreateRoomDialog() {
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState(generateRandomString(8));

  useEffect(() => {
    setOtp(generateRandomString(8));
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Plus className="h-4 w-4" /> Create new room
      </Button>
      <NativeModal
        openModal={open}
        closeModal={() => setOpen(false)}
        className="rounded-2xl w-[500px]"
      >
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create new room
            </h1>
            <p className="text-sm text-gray-500">
              Please enter the attendance room id for the event
            </p>
          </div>

          <div className="flex justify-center">
            <InputOTP
              maxLength={8}
              className="gap-2"
              value={otp}
              onChange={(e) => setOtp(e)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
                <InputOTPSlot index={6} />
                <InputOTPSlot index={7} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button>Create</Button>
          </div>
        </div>
      </NativeModal>
    </>
  );
}
