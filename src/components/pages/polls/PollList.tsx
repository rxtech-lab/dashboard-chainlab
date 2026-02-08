"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Spinner from "../../ui/spinner";
import {
  deletePoll,
  updatePoll,
} from "@/app/(internal)/(protected)/(sidebar)/polls/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { poll } from "@/lib/schema";
import { Edit2Icon } from "lucide-react";

type PollBase = typeof poll.$inferSelect;
type Poll = PollBase & {
  semester?: { id: number; name: string } | null;
  questions?: { id: number }[];
};

export function PollList({ polls }: { polls: Poll[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatePresence mode="popLayout">
        {polls.map((poll) => (
          <motion.div
            key={poll.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            layout
            layoutId={poll.id.toString()}
            transition={{
              duration: 0.2,
              layout: {
                duration: 0.2,
              },
            }}
          >
            <PollCard poll={poll} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface PollCardProps {
  poll: Poll;
}

function PollCard({ poll }: PollCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    const { error } = await updatePoll(poll.id, {
      isOpen: !poll.isOpen,
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
        description: "Poll updated successfully",
        variant: "success",
      });
      router.refresh();
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete this poll? All responses will be lost.",
    );
    if (!confirm) return;
    setIsLoading(true);
    const { error } = await deletePoll(poll.id).finally(() => {
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
      router.refresh();
    }
  };

  const questionCount = poll.questions?.length ?? 0;

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 relative 
        transition-all duration-200 hover:shadow-lg hover:border-gray-300
        ${isLoading ? "pointer-events-none" : ""}`}
      data-testid="poll-card"
    >
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-10"
        >
          <Spinner />
        </motion.div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={poll.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {poll.title}
              </h3>
              {poll.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {poll.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-gray-500">
                  {questionCount}{" "}
                  {questionCount === 1 ? "question" : "questions"}
                </p>
                {poll.requireIdentification && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Identified
                  </span>
                )}
              </div>
              {poll.classItem && (
                <p className="text-sm text-blue-600 mt-1">
                  Class: {poll.classItem.name}
                  {poll.semester && ` (${poll.semester.name})`}
                </p>
              )}
              {!poll.classItem && poll.semester && (
                <p className="text-sm text-gray-600 mt-1">
                  Semester: {poll.semester.name}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={poll.isOpen}
              onChange={handleToggle}
            />
            <div
              className="w-11 h-6 bg-gray-200 rounded-full peer 
                peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                peer-checked:after:border-white after:content-[''] after:absolute 
                after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 
                after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                peer-checked:bg-blue-600"
            ></div>
          </label>
          <Link
            href={`/polls/${poll.id}/edit`}
            className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
            aria-label="Edit poll"
          >
            <Edit2Icon className="h-5 w-5" />
          </Link>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600 transition-colors duration-200"
            disabled={isLoading}
            aria-label="Delete poll"
            data-testid="delete-poll-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <p>Created: {new Date(poll.createdAt).toLocaleDateString()}</p>
        </div>
        <Link
          href={`/polls/${poll.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
