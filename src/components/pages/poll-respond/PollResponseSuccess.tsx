"use client";

import { CheckCircle2 } from "lucide-react";
import PollResponseResults from "./PollResponseResults";

interface PollResponseSuccessProps {
  pollId: number;
  pollTitle: string;
}

export default function PollResponseSuccess({
  pollId,
  pollTitle,
}: PollResponseSuccessProps) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center max-w-3xl mx-auto">
        <div className="flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thank You for Your Response!
          </h2>
          <p className="text-gray-600">
            Your answers have been successfully submitted.
          </p>
        </div>
      </div>

      <PollResponseResults pollId={pollId} pollTitle={pollTitle} />
    </div>
  );
}
