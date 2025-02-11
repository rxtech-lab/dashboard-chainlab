"use client";

import { signOut } from "@/app/(auth)/auth/actions";
import { ChainConfig } from "@/config/config";
import { useRouter } from "next/navigation";
import { isMobile } from "react-device-detect";
import {
  EnvironmentContextProvider,
  MetaMaskProvider,
  SessionResponse,
  WalletConnectProvider,
  WalletContextProvider,
} from "web3-connect-react";

interface ProvidersProps {
  children: React.ReactNode;
  session: SessionResponse;
}

export function Providers({ children, session }: ProvidersProps) {
  const router = useRouter();

  return (
    <EnvironmentContextProvider isMobile={isMobile} isTest={false}>
      <WalletContextProvider
        session={session}
        listenToAccountChanges={false}
        listenToChainChanges={false}
        providers={[
          MetaMaskProvider,
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
        ]}
        onSignedOut={async () => {
          await signOut();
          router.refresh();
        }}
      >
        {children}
      </WalletContextProvider>
    </EnvironmentContextProvider>
  );
}
