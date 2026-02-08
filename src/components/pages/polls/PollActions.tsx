"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../ui/button";
import {
  updatePoll,
  deletePoll,
} from "@/app/(internal)/(protected)/(sidebar)/polls/actions";
import { useToast } from "@/hooks/use-toast";
import { Edit2Icon, Trash2Icon } from "lucide-react";
import Link from "next/link";

interface PollActionsProps {
  pollId: number;
  isOpen: boolean;
}

export default function PollActions({ pollId, isOpen }: PollActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    const { error } = await updatePoll(pollId, {
      isOpen: !isOpen,
    }).finally(() => {
      setIsLoading(false);
    });
    if (error) {
      toast.toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast.toast({
        title: "Success",
        description: `Poll ${!isOpen ? "opened" : "closed"} successfully`,
        variant: "success",
      });
      router.refresh();
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete this poll? All responses will be permanently lost.",
    );
    if (!confirm) return;

    setIsLoading(true);
    const { error } = await deletePoll(pollId).finally(() => {
      setIsLoading(false);
    });

    if (error) {
      toast.toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast.toast({
        title: "Success",
        description: "Poll deleted successfully",
        variant: "success",
      });
      router.push("/polls");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={isOpen}
          onChange={handleToggle}
          disabled={isLoading}
        />
        <div
          className="w-11 h-6 bg-gray-200 rounded-full peer 
            peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
            peer-checked:after:border-white after:content-[''] after:absolute 
            after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 
            after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
            peer-checked:bg-blue-600"
        ></div>
        <span className="ml-3 text-sm font-medium text-gray-900">
          {isOpen ? "Open" : "Closed"}
        </span>
      </label>

      <Link href={`/polls/${pollId}/edit`}>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Edit2Icon className="h-4 w-4" />
          Edit
        </Button>
      </Link>

      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <Trash2Icon className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}
