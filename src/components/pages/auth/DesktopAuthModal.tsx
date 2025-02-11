import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import type { WalletProvider } from "web3-connect-react";
import { LeftPanelContent } from "./LeftPanelContent";
import { WalletOption } from "./WalletOption";

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
  connect: (provider: WalletProvider) => Promise<void>;
}

export function DesktopAuthModal({ sdk, connect }: Props) {
  const initialWidth = "min(500px, 45vw)";
  const animateWidth = "min(1000px, 90vw)";
  return (
    <motion.div
      initial={{ width: initialWidth }}
      animate={{ width: animateWidth }}
      transition={{
        delay: ANIMATION_CONFIG.delay,
        duration: ANIMATION_CONFIG.duration,
        ease: ANIMATION_CONFIG.ease,
      }}
      className="relative"
    >
      <Card className="w-full h-full min-h-[500px] flex !shadow-xl rounded-3xl overflow-hidden border-0">
        <div className="relative w-full">
          {/* Right Panel */}
          <motion.div
            initial={{ x: "-50%" }}
            animate={{ x: 0 }}
            transition={{
              delay: ANIMATION_CONFIG.delay,
              duration: ANIMATION_CONFIG.duration,
              ease: ANIMATION_CONFIG.ease,
            }}
            style={{ width: initialWidth }}
            className="absolute inset-0 left-1/2 p-8 flex flex-col justify-center bg-gradient-to-br from-slate-50 to-slate-100"
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

          {/* Left Panel */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            style={{ width: initialWidth }}
            className="absolute inset-0 p-12 flex flex-col justify-center items-start bg-white overflow-hidden"
          >
            <LeftPanelContent />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
