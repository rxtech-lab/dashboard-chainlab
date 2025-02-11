"use client";

import { useAvatar } from "@/hooks/useAvatar";
import BoringAvatar from "boring-avatars";
import { Skeleton } from "../ui/skeleton";
import { motion, AnimatePresence } from "motion/react";

interface AvatarProps {
  address: string;
}

export function Avatar({ address }: AvatarProps) {
  // resolve ens avatar
  const { avatar, isLoading } = useAvatar({ address });

  const fadeAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div key="skeleton" {...fadeAnimation}>
          <Skeleton className="w-10 h-10 rounded-full P-1" />
        </motion.div>
      ) : avatar ? (
        <motion.div key="boring-avatar" {...fadeAnimation}>
          <BoringAvatar name={address} size={40} />
        </motion.div>
      ) : (
        <motion.div
          key="avatar"
          {...fadeAnimation}
          className="w-10 h-10 rounded-full overflow-hidden border p-1"
        >
          <img
            src={avatar as any}
            alt="Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
