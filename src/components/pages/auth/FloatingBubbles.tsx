import { motion } from "motion/react";

export function FloatingBubbles() {
  return (
    <div className="absolute inset-0 opacity-5 hidden md:block overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 w-40 h-40 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2"
        animate={{
          y: [-30, -10, -30],
          x: [-40, -20, -40],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-60 h-60 bg-primary rounded-full translate-x-1/2 translate-y-1/2"
        animate={{
          y: [0, -30, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
