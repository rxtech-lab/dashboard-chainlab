"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useWallet } from "web3-connect-react";

export default function AttendanceSignOutButton() {
  const { isSignedIn, signOut } = useWallet();
  const router = useRouter();

  if (!isSignedIn) {
    return null;
  }

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
