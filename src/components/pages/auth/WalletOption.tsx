import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { useWallet, WalletProvider } from "web3-connect-react";

interface WalletOptionProps {
  provider: WalletProvider;
  isEnabled: boolean;
  connect: (provider: WalletProvider) => void;
}

export function WalletOption({
  provider,
  isEnabled,
  connect,
}: WalletOptionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { signIn, isSignedIn } = useWallet();

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors flex-wrap gap-4 bg-white">
      <div className="flex items-center gap-5 flex-wrap">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: provider.metadata.iconBackgroundColor }}
        >
          {React.cloneElement(provider.metadata.image as any, {
            width: 24,
            height: 24,
            className: "w-6 h-6",
          })}
        </div>
        <div className="min-w-[200px]">
          <h3 className="font-medium">{provider.metadata.displayName}</h3>
          <p className="text-sm text-gray-500">
            {provider.metadata.description}
          </p>
        </div>
      </div>
      <div className="ml-auto">
        <Button
          onClick={() => connect(provider)}
          loading={isConnecting}
          disabled={!isEnabled || isConnecting || isSignedIn}
          variant={
            isEnabled ? (isSignedIn ? "secondary" : "default") : "secondary"
          }
        >
          {isEnabled ? (isSignedIn ? "Connected" : "Connect") : "Not installed"}
        </Button>
      </div>
    </div>
  );
}
