"use client";

import { Card } from "@/components/ui/card";
import useSWR from "swr";
import { getPollResultsPublic } from "@/app/(public)/poll/[id]/respond/actions";
import Spinner from "@/components/ui/spinner";
import type {
  QuestionResult,
  SelectResult,
  MultipleChoiceResult,
  BooleanResult,
} from "../polls/poll.types";

interface PollResponseResultsProps {
  pollId: number;
  pollTitle: string;
}

export default function PollResponseResults({
  pollId,
  pollTitle,
}: PollResponseResultsProps) {
  const { data, isLoading, error } = useSWR(
    `/api/poll-results-public/${pollId}`,
    async () => {
      const result = await getPollResultsPublic(pollId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    {
      refreshInterval: 10000, // Refresh every 10 seconds
    },
  );

  if (isLoading) {
    return (
      <Card className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center min-h-[200px]">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 max-w-3xl mx-auto">
        <div className="text-center text-red-600">
          <p>Error loading results</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">{pollTitle}</h2>
          <p className="text-gray-600 mt-2">Poll Results</p>
          <div className="mt-3">
            <span className="text-sm text-gray-500">
              <span className="font-medium text-blue-600">
                {data.totalRespondents}
              </span>{" "}
              {data.totalRespondents === 1 ? "response" : "responses"} so far
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {data.questions.map((question, index) => (
            <QuestionResultCard
              key={question.questionId}
              question={question}
              index={index}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function QuestionResultCard({
  question,
  index,
}: {
  question: QuestionResult;
  index: number;
}) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="mb-4">
        <h3 className="font-medium text-gray-900">
          {index + 1}. {question.questionText}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {question.totalResponses}{" "}
          {question.totalResponses === 1 ? "response" : "responses"}
        </p>
      </div>

      {question.questionType === "SELECT" && (
        <SelectResults results={question.results as SelectResult[]} />
      )}
      {question.questionType === "MULTIPLE_CHOICE" && (
        <MultipleChoiceResults
          results={question.results as MultipleChoiceResult[]}
        />
      )}
      {question.questionType === "TEXT" && (
        <div className="text-sm text-gray-500 italic">
          Text responses are only visible to the poll creator
        </div>
      )}
      {question.questionType === "BOOLEAN" && (
        <BooleanResults results={question.results as BooleanResult} />
      )}
    </div>
  );
}

function SelectResults({ results }: { results: SelectResult[] }) {
  const maxCount = Math.max(...results.map((r) => r.count), 1);

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div key={result.optionId} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{result.optionText}</span>
            <span className="text-gray-600">
              {result.count} ({result.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(result.count / maxCount) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MultipleChoiceResults({
  results,
}: {
  results: MultipleChoiceResult[];
}) {
  const maxCount = Math.max(...results.map((r) => r.count), 1);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 italic">
        Multiple selections allowed
      </p>
      {results.map((result) => (
        <div key={result.optionId} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{result.optionText}</span>
            <span className="text-gray-600">
              {result.count} ({result.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(result.count / maxCount) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BooleanResults({ results }: { results: BooleanResult }) {
  const total = results.trueCount + results.falseCount;

  if (total === 0) {
    return <p className="text-sm text-gray-500 italic">No responses yet</p>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Yes</span>
          <span className="text-gray-600">
            {results.trueCount} ({results.truePercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${results.truePercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">No</span>
          <span className="text-gray-600">
            {results.falseCount} ({results.falsePercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-red-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${results.falsePercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
