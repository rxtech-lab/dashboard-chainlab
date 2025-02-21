"use client";

import { signOut as signOutInternally } from "@/app/(internal)/(auth)/auth/actions";
import { signOut as signOutPublicly } from "@/app/(public)/attendance/actions";
import { ChainConfig } from "@/config/config";
import { useRouter } from "next/navigation";
import { isMobile } from "react-device-detect";
import {
  EnvironmentContextProvider,
  InAppWalletProvider,
  MetaMaskMockProvider,
  MetaMaskProvider,
  SessionResponse,
  WalletConnectProvider,
  WalletContextProvider,
} from "web3-connect-react";

interface ProvidersProps {
  children: React.ReactNode;
  session: SessionResponse;
  mode: "internal" | "public";
}

export function Providers({ children, session, mode }: ProvidersProps) {
  const router = useRouter();

  return (
    <EnvironmentContextProvider
      isMobile={isMobile}
      isTest={process.env.IS_TEST === "true"}
    >
      <WalletContextProvider
        session={session}
        listenToAccountChanges={false}
        listenToChainChanges={false}
        providers={[
          MetaMaskProvider,
          InAppWalletProvider,
          WalletConnectProvider({
            projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
            chains: [ChainConfig],
            ethersConfig: {
              metadata: {
                name: "",
                description: "",
                url: "",
                icons: [],
              },
            },
          }),
          MetaMaskMockProvider,
        ]}
        onSignedOut={async () => {
          if (mode === "internal") {
            await signOutInternally();
          } else {
            await signOutPublicly();
          }
          router.refresh();
        }}
        environment={{
          env: "e2e",
          endpoint: `http://0.0.0.0:4000?visibility=${mode}`,
        }}
      >
        {children}
      </WalletContextProvider>
    </EnvironmentContextProvider>
  );
}
