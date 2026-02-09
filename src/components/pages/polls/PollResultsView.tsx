"use client";

import { usePollResults } from "@/hooks/usePollResults";
import Spinner from "../../ui/spinner";
import { Card } from "../../ui/card";
import type {
  QuestionResult,
  SelectResult,
  MultipleChoiceResult,
  TextResult,
  BooleanResult,
} from "./poll.types";

interface PollResultsViewProps {
  pollId: number;
}

export default function PollResultsView({ pollId }: PollResultsViewProps) {
  const { data, isLoading, error } = usePollResults(pollId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
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
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-lg font-semibold">Poll Results</h3>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">
              {data.totalRespondents}
            </span>{" "}
            {data.totalRespondents === 1 ? "respondent" : "respondents"}
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
        <h4 className="font-medium text-gray-900">
          {index + 1}. {question.questionText}
        </h4>
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
        <TextResults results={question.results as TextResult[]} />
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

function TextResults({ results }: { results: TextResult[] }) {
  if (results.length === 0) {
    return <p className="text-sm text-gray-500 italic">No responses yet</p>;
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {results.map((result) => (
        <div
          key={result.answerId}
          className="bg-white p-3 rounded border border-gray-200"
        >
          <p className="text-sm text-gray-900">{result.answerText}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(result.createdAt).toLocaleString()}
          </p>
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
