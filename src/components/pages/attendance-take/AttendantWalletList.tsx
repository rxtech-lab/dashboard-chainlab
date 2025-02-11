"use client";

import { signInAsAttendant } from "@/app/(public)/attendance/[id]/take/actions";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { getAttendantSignInMessage } from "@/config/config";
import { useToast } from "@/hooks/use-toast";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { AvailableProvider, useAddresses, useWallet } from "web3-connect-react";

interface Props {
  user?: {
    firstName: string;
    lastName: string;
    userId: string;
  };
  attendants: {
    id: number;
    firstName: string;
    lastName: string;
    disabled: boolean;
  }[];
}

export default function AttendantWalletList(props: Props) {
  const { sdk, isSignedIn, signIn } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<Props["user"] | null>(null);

  const nonce = searchParams.get("nonce");
  const roomId = params.roomId as string;
  const addresses = useAddresses("ethereum");
  useEffect(() => {
    setUser(props.user);
  }, [props.user]);

  const connect = async (wallet: AvailableProvider) => {
    setIsLoading(true);
    await signIn(wallet, {
      onSignedIn: async (address, provider, session) => {},
      getSignInData: async (address, provider) => {},
    })
      .catch((error) => {
        toast.toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
        router.refresh();
      });
  };

  const takeAttendance = async () => {
    if (addresses.addresses.length === 0) {
      toast.toast({
        title: "Error",
        description: "No addresses found",
        variant: "destructive",
      });
      return;
    }
    if (!user || !nonce) {
      toast.toast({
        title: "Error",
        description: "User or nonce not found",
        variant: "destructive",
      });
      return;
    }
    const address = addresses.addresses[0];
    const signature = await sdk.provider.signMessage(
      getAttendantSignInMessage(user, nonce),
      {}
    );
    const { error } = await signInAsAttendant(
      user,
      parseInt(roomId),
      signature,
      address
    );
    if (error) {
      toast.toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  };

  if (isSignedIn) {
    return (
      <div>
        <select>
          {props.attendants?.map((attendant) => (
            <option key={attendant.id} value={attendant.id}>
              {attendant.firstName} {attendant.lastName}
            </option>
          ))}
        </select>
        <button onClick={takeAttendance}>Take Attendance</button>
      </div>
    );
  }

  return (
    <div>
      <Label>Sign in with your wallet</Label>
      <select
        defaultValue="select"
        onChange={(e) => {
          connect(e.target.value as AvailableProvider);
        }}
      >
        <option value="select" disabled></option>
        {sdk?.walletProviders
          .filter((wallet) => wallet.isVisible(isMobile))
          .map((wallet) => (
            <option
              key={wallet.metadata.name}
              value={wallet.metadata.name}
              disabled={!wallet.isEnabled(sdk.walletProviders)}
            >
              {wallet.metadata.name}
            </option>
          ))}
      </select>
    </div>
  );
}
