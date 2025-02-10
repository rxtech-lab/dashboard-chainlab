import { Wallet, ArrowRight } from "lucide-react";
import { Dosis } from "next/font/google";
import { FloatingBubbles } from "./FloatingBubbles";
import { motion } from "motion/react";

const font = Dosis({ subsets: ["latin"] });

export function LeftPanelContent() {
  return (
    <>
      <FloatingBubbles />

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Wallet className="w-16 h-16 text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl mb-4 relative"
      >
        <span
          className="font-extralight block"
          style={{ fontFamily: font.style.fontFamily }}
        >
          Connect Your
        </span>
        <span className="text-primary font-bold block">Wallet</span>
      </motion.h2>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 text-muted-foreground"
      >
        <p className="text-sm">Choose your preferred wallet</p>
        <ArrowRight className="w-6 h-6 text-primary animate-bounce-x" />
      </motion.div>
    </>
  );
}
