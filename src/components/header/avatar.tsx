"use client";

import { useAvatar } from "@/hooks/useAvatar";
import BoringAvatar from "boring-avatars";
import { Skeleton } from "../ui/skeleton";

interface AvatarProps {
  address: string;
}

export function Avatar({ address }: AvatarProps) {
  // resolve ens avatar
  const { avatar, isLoading } = useAvatar({ address });

  if (isLoading) {
    return <Skeleton className="w-10 h-10 rounded-full" />;
  }

  if (!avatar) {
    return <BoringAvatar name={address} size={40} />;
  }

  return (
    <div className="w-10 h-10 rounded-full overflow-hidden border p-1">
      <img
        src={avatar}
        alt={"Avatar"}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
}
