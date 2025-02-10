"use client";

import { useAvatar } from "@/hooks/useAvatar";
import { LogOut } from "lucide-react";
import { useWallet } from "web3-connect-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar } from "./avatar";

interface UserProps {
  address: string;
}

export function User({ address }: UserProps) {
  const { name, isLoading } = useAvatar({ address });
  const { signOut } = useWallet();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none">
          <Avatar address={address} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-white py-3 border rounded-xl shadow-lg"
      >
        <DropdownMenuItem
          className="px-4 py-2 mb-2 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => {
            if (name) {
              window.open(`https://app.ens.domains/${name}`, "_blank");
            } else {
              window.open(`https://etherscan.io/address/${address}`, "_blank");
            }
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar address={address} />
            <div className="flex flex-col">
              {isLoading ? (
                <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
              ) : name ? (
                <span className="font-medium">{name}</span>
              ) : (
                <span className="font-medium text-gray-700">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {name && `${address.slice(0, 6)}...${address.slice(-4)}`}
              </span>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gray-50 text-red-600 transition-colors"
          onClick={async () => {
            await signOut();
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
