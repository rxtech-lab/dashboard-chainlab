"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useWallet } from "web3-connect-react";

export default function AttendanceSignOutButton() {
  const { signOut } = useWallet();
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        signOut();
        router.refresh();
      }}
      variant="outline"
      className="w-full"
    >
      Sign Out
    </Button>
  );
}
