"use client";

import { Button } from "@/components/ui/button";
import { useWallet, WalletProvider } from "web3-connect-react";
import React, { useState } from "react";
import {
  getSignInMessage,
  signIn as signInAction,
} from "@/app/(auth)/auth/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

interface WalletOptionProps {
  provider: WalletProvider;
  isEnabled: boolean;
}

export function WalletOption({ provider, isEnabled }: WalletOptionProps) {
  const { signIn, isSignedIn } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const router = useRouter();

  const connect = async (provider: WalletProvider) => {
    setIsConnecting(true);

    await signIn(provider.metadata.name, {
      async getSignInData(address, provider) {
        const message = await getSignInMessage(address);
        const signature = await provider.signMessage(message.message, {
          forAuthentication: true,
        });
        return {
          message: message.message,
          signature,
          walletAddress: address,
        };
      },
      async onSignedIn(address, provider, session) {
        const { error } = await signInAction(session);
        if (error) {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
          throw new Error(error);
        } else {
          toast({
            title: "Success",
            description: "Signed in successfully",
          });
          if (redirect) {
            router.push(redirect);
          } else {
            router.push("/");
          }
        }
      },
    }).finally(() => setIsConnecting(false));
  };

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
          disabled={!isEnabled || isConnecting || isSignedIn}
          variant={
            isEnabled
              ? isConnecting
                ? "default"
                : isSignedIn
                ? "secondary"
                : "default"
              : "secondary"
          }
        >
          {isConnecting
            ? "Connecting..."
            : !isSignedIn
            ? "Connect"
            : "Connected"}
        </Button>
      </div>
    </div>
  );
}
