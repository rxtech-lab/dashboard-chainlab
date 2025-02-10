"use client";

import { useWallet } from "web3-connect-react";
import { DesktopAuthModal } from "./DesktopAuthModal";
import { MobileAuthModal } from "./MobileAuthModal";

export default function AuthenticationModal() {
  const { sdk } = useWallet();

  return (
    <div className="w-auto mx-auto p-4 h-full flex items-center justify-center">
      <div className="md:block hidden">
        <DesktopAuthModal sdk={sdk} />
      </div>
      <div className="md:hidden block">
        <MobileAuthModal sdk={sdk} />
      </div>
    </div>
  );
}
