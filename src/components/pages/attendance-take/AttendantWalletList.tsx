"use client";

import {
  signInAsAttendant,
  takeAttendance as takeAttendanceAction,
} from "@/app/(public)/attendance/[id]/take/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { getAttendantSignInMessage } from "@/config/config";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { isMobile } from "react-device-detect";
import { AvailableProvider, useAddresses, useWallet } from "web3-connect-react";
import AttendanceSignoutButton from "./SignOutButton";
import { ChevronDown } from "lucide-react";
import { verifyMessage } from "ethers";

interface Props {
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    userId: string;
  };
  attendants: {
    id: number;
    userId: string;
    firstName: string;
    lastName: string;
    disabled: boolean;
  }[];
}

// Create a styled select component
function StyledSelect({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 hover:border-indigo-400 active:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg appearance-none bg-white transition-colors duration-200"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none group-hover:text-indigo-400 group-active:text-indigo-500 transition-colors duration-200" />
    </div>
  );
}

export default function AttendantWalletList(props: Props) {
  const {
    sdk,
    isSignedIn,
    signIn,
    isLoading: isLoadingWallet,
    signOut,
  } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<Props["user"] | null>(() => {
    if (props.user) return props.user;
    if (!props.attendants.length) return null;

    // Find first non-disabled attendant
    const firstEnabledAttendant = props.attendants.find((a) => !a.disabled);
    return firstEnabledAttendant || null;
  });

  const nonce = searchParams.get("nonce");
  const roomId = params.id as string;
  const addresses = useAddresses("ethereum");

  // Add this check for all disabled attendants
  const allAttendeesDisabled = props.attendants?.every(
    (attendant) => attendant.disabled
  );

  const connect = async (wallet: AvailableProvider) => {
    const confirm = await window.confirm(
      `Are you sure you want to connect your wallet using ${wallet}?`
    );
    if (!confirm) {
      return;
    }
    setIsLoading(true);
    await signIn(wallet, {
      onSignedIn: async (address, provider, session) => {
        await signInAsAttendant(session);
      },
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

    if (!user) {
      toast.toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }

    if (!nonce) {
      toast.toast({
        title: "Error",
        description: "Nonce not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const address = addresses.addresses[0];
      const message = getAttendantSignInMessage(props.user ?? user, nonce);
      const signature = await sdk.provider.signMessage(message, {});

      const { error } = await takeAttendanceAction(
        props.user ?? user,
        parseInt(roomId),
        nonce,
        signature,
        address
      );
      if (error) {
        toast.toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast.toast({
          title: "Success",
          description: "Attendance taken successfully",
          variant: "success",
        });
        router.refresh();
      }
    } catch (error: any) {
      toast.toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoadingWallet) {
    return (
      <div className="flex justify-center items-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex flex-col flex-grow">
        <div className="flex-grow">
          {!Boolean(props.user) && (
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-gray-700">
                Select your name
              </Label>
              {allAttendeesDisabled ? (
                <div className="text-sm text-red-500 mt-2">
                  All attendants have already taken attendance
                </div>
              ) : (
                <StyledSelect
                  value={user?.id || ""}
                  onChange={(e) => {
                    const attendant = props.attendants.find(
                      (attendant) => attendant.id.toString() === e.target.value
                    );
                    if (attendant) {
                      setUser(attendant);
                    }
                  }}
                  data-testid="attendant-select"
                >
                  <option value="" disabled>
                    Select your name
                  </option>
                  {props.attendants?.map((attendant) => (
                    <option
                      key={attendant.userId}
                      value={attendant.id}
                      disabled={attendant.disabled}
                      className={attendant.disabled ? "text-gray-400" : ""}
                    >
                      {attendant.firstName} {attendant.lastName}
                    </option>
                  ))}
                </StyledSelect>
              )}
            </div>
          )}
          {props.user !== undefined && (
            <div className="space-y-2">
              <div className="flex flex-col space-y-1">
                <Label className="text-sm font-medium text-gray-500">
                  Your Name
                </Label>
                <div className="text-lg font-semibold text-gray-900">
                  {props.user.firstName} {props.user.lastName}
                </div>
                <div className="text-xs text-gray-500">
                  ID: {props.user.userId}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:mt-4 fixed bottom-0 left-0 right-0 bg-white p-4 lg:p-0 lg:static">
          <Button
            onClick={() => {
              setIsLoading(true);
              takeAttendance().finally(() => {
                setIsLoading(false);
              });
            }}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            loading={isLoading}
            disabled={allAttendeesDisabled && !props.user}
            data-testid="take-attendance-button"
          >
            Take Attendance
          </Button>

          <AttendanceSignoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="block text-sm font-medium text-gray-700">
          Sign in with your wallet
        </Label>
        <StyledSelect
          defaultValue="select"
          onChange={(e) => {
            connect(e.target.value as AvailableProvider);
          }}
          data-testid="wallet-select"
        >
          <option value="select" disabled>
            Select a wallet
          </option>
          {sdk?.walletProviders
            .filter((wallet) => wallet.isVisible(isMobile))
            .map((wallet) => (
              <option
                key={wallet.metadata.name}
                value={wallet.metadata.name}
                disabled={!wallet.isEnabled(sdk.walletProviders)}
                data-testid={`wallet-option-${wallet.metadata.name}`}
                className={
                  !wallet.isEnabled(sdk.walletProviders) ? "text-gray-400" : ""
                }
              >
                {wallet.metadata.name}
              </option>
            ))}
        </StyledSelect>
      </div>
      {isLoading && (
        <div className="flex justify-center">
          <Spinner className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
