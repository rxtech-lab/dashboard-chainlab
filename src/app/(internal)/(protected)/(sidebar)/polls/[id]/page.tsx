import PollDetailView from "@/components/pages/polls/PollDetailView";
import PollActions from "@/components/pages/polls/PollActions";
import { notFound } from "next/navigation";
import { getPoll } from "../actions";
import type { Metadata } from "next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Poll Detail",
  description: "Poll Detail",
};

export default async function PollDetailPage({ params }: any) {
  const { data: poll, error: err } = await getPoll(Number((await params).id));

  if (err) {
    notFound();
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="mx-auto w-full px-4 lg:px-6">
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/polls">Polls</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{poll!.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{poll!.title}</h1>
                {poll!.description && (
                  <p className="text-gray-600 mt-2">{poll!.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <p className="text-sm text-gray-500">
                    {poll!.questions.length}{" "}
                    {poll!.questions.length === 1 ? "question" : "questions"}
                  </p>
                  {poll!.requireIdentification && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Requires Identification
                    </span>
                  )}
                  {poll!.classItem && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {poll!.classItem.name}
                      {poll!.semester && ` (${poll!.semester.name})`}
                    </span>
                  )}
                  {!poll!.classItem && poll!.semester && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {poll!.semester.name}
                    </span>
                  )}
                </div>
              </div>
              <PollActions pollId={poll!.id} isOpen={poll!.isOpen} />
            </div>
          </Card>

          <PollDetailView pollId={poll!.id} isOpen={poll!.isOpen} />
        </div>
      </div>
    </div>
  );
}
