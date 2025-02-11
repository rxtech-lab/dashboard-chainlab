"use client";

import {
  getSignInMessage,
  signIn as signInAction,
} from "@/app/(internal)/(auth)/auth/actions";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useWallet, WalletProvider } from "web3-connect-react";
import { DesktopAuthModal } from "./DesktopAuthModal";
import { MobileAuthModal } from "./MobileAuthModal";

export default function AuthenticationModal() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { sdk } = useWallet();
  const redirect = searchParams.get("redirect");
  const router = useRouter();
  const { signIn } = useWallet();

  const connect = async (provider: WalletProvider) => {
    try {
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
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-auto mx-auto p-4 h-full flex items-center justify-center">
      <div className="md:block hidden">
        <DesktopAuthModal sdk={sdk} connect={connect} />
      </div>
      <div className="md:hidden block">
        <MobileAuthModal sdk={sdk} connect={connect} />
      </div>
    </div>
  );
}
