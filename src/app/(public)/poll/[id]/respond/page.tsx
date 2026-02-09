"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PollResponseForm from "@/components/pages/poll-respond/PollResponseForm";
import PollResponseSuccess from "@/components/pages/poll-respond/PollResponseSuccess";
import {
  getPollForResponding,
  getAllAttendant,
  hasRespondedToPoll,
} from "./actions";
import Spinner from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { CircleAlertIcon } from "lucide-react";

export default function PollRespondPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const nonce = searchParams.get("nonce");
  const pollId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poll, setPoll] = useState<any>(null);
  const [attendants, setAttendants] = useState<any[]>([]);
  const [hasResponded, setHasResponded] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const loadPollData = async () => {
      if (!nonce) {
        setError("Invalid link. Missing nonce parameter.");
        setLoading(false);
        return;
      }

      try {
        // Check if already responded
        const respondedResult = await hasRespondedToPoll(pollId);
        if (respondedResult.data) {
          setHasResponded(true);
          setShowResults(true);
          setLoading(false);
          return;
        }

        // Fetch poll data
        const pollResult = await getPollForResponding(pollId, nonce);
        if (pollResult.error) {
          setError(pollResult.error);
          setLoading(false);
          return;
        }

        setPoll(pollResult.data);

        // If poll requires identification, fetch attendants
        if (pollResult.data?.requireIdentification) {
          const attendantsResult = await getAllAttendant(pollId);
          if (attendantsResult.data) {
            setAttendants(attendantsResult.data);
          }
        }

        setLoading(false);
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);
      }
    };

    loadPollData();
  }, [pollId, nonce]);

  const handleSuccess = () => {
    setHasResponded(true);
    setShowResults(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8">
          <div className="flex flex-col items-center">
            <Spinner />
            <p className="text-gray-600 mt-4">Loading poll...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <div className="bg-red-50 border border-red-200 rounded-full p-4 inline-flex mb-4">
            <CircleAlertIcon className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Unable to Load Poll
          </h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Poll Not Found
          </h2>
          <p className="text-gray-600">
            The poll you're looking for could not be found.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {showResults ? (
        <PollResponseSuccess pollId={pollId} pollTitle={poll.title} />
      ) : (
        <PollResponseForm
          pollId={pollId}
          nonce={nonce!}
          poll={poll}
          attendants={poll.requireIdentification ? attendants : undefined}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
