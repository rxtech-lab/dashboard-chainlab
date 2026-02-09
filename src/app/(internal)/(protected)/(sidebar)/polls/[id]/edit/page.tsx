import PollEditForm from "@/components/pages/polls/PollEditForm";
import { notFound } from "next/navigation";
import { getPoll } from "../../actions";
import type { Metadata } from "next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Edit Poll",
  description: "Edit Poll",
};

export default async function PollEditPage({ params }: any) {
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
                  <BreadcrumbLink href={`/polls/${poll!.id}`}>
                    {poll!.title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <PollEditForm
            pollId={poll!.id}
            initialData={{
              title: poll!.title,
              description: poll!.description,
              requireIdentification: poll!.requireIdentification,
              semesterId: poll!.semesterId,
              classId: poll!.classId,
              questions: poll!.questions,
            }}
          />
        </div>
      </div>
    </div>
  );
}
