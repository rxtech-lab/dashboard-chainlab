"use client";

import { usePollUrl } from "@/hooks/usePollUrl";
import PollQRCodePanel from "@/components/polls/PollQRCodePanel";
import PollResultsView from "./PollResultsView";

interface PollDetailViewProps {
  pollId: number;
  isOpen: boolean;
}

export default function PollDetailView({
  pollId,
  isOpen,
}: PollDetailViewProps) {
  const { data, isLoading } = usePollUrl(pollId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: QR Code Panel */}
      <div className="lg:col-span-1">
        <PollQRCodePanel
          isLoading={isLoading}
          isOpen={isOpen}
          qrCode={data?.qrCode}
          exp={data?.exp}
          pollId={pollId}
        />
      </div>

      {/* Right: Results */}
      <div className="lg:col-span-2">
        <PollResultsView pollId={pollId} />
      </div>
    </div>
  );
}
