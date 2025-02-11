import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import { WalletOption } from "./WalletOption";
import type { WalletProvider } from "web3-connect-react";
import { LeftPanelContent } from "./LeftPanelContent";

const ANIMATION_CONFIG = {
  duration: 1,
  iconDuration: 0.5,
  delay: 1,
  ease: "easeInOut",
} as const;

interface Props {
  sdk: {
    walletProviders: WalletProvider[];
  };
  connect: (provider: WalletProvider) => void;
}

export function MobileAuthModal({ sdk, connect }: Props) {
  return (
    <motion.div
      initial={{ width: "100%", opacity: 0 }}
      animate={{ width: "100%", opacity: 1 }}
      transition={{
        delay: ANIMATION_CONFIG.delay,
        duration: ANIMATION_CONFIG.duration,
        ease: ANIMATION_CONFIG.ease,
      }}
      className="w-full"
    >
      <Card className="w-full min-h-[500px] !shadow-xl rounded-3xl overflow-hidden border-t border-l border-r md:border-0">
        <div className="flex flex-col w-full h-full">
          {/* Top Panel */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full p-12 flex flex-col items-center bg-white"
          >
            <LeftPanelContent />
          </motion.div>

          {/* Bottom Panel */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: ANIMATION_CONFIG.delay,
              duration: ANIMATION_CONFIG.duration,
              ease: ANIMATION_CONFIG.ease,
            }}
            className="w-full p-8 flex flex-col bg-gradient-to-br from-slate-50 to-slate-50"
          >
            <div className="grid gap-4">
              {sdk.walletProviders.map((provider) => (
                <WalletOption
                  key={provider.metadata.name}
                  provider={provider}
                  isEnabled={provider.isEnabled(sdk.walletProviders)}
                  connect={connect}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
