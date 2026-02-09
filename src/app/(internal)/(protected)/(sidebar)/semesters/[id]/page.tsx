import Header from "@/components/header/Header";
import { Config } from "@/config/config";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getSemester, getClasses } from "./actions";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const CreateClassDialog = dynamic(
  () => import("@/components/pages/classes/CreateClassDialog"),
  { ssr: !!false }
);

const ClassTable = dynamic(
  () => import("@/components/pages/classes/ClassTable"),
  { ssr: !!false }
);

export const metadata: Metadata = {
  title: "Classes",
  description: "Manage classes",
};

export default async function SemesterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const semesterId = Number.parseInt(id);
  const search = await searchParams;
  const currentPage = search.page ? Number.parseInt(search.page) : 1;

  const [semesterData, classesData] = await Promise.all([
    getSemester(semesterId),
    getClasses(semesterId, currentPage, Config.App.pageLimit),
  ]);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="mx-auto w-full px-4 lg:px-6">
          <Header
            breadcrumbs={[
              { title: "Home", url: "/" },
              { title: "Semesters", url: "/semesters" },
              {
                title: semesterData.data.name,
                url: `/semesters/${semesterId}`,
              },
            ]}
          />
          <div className="flex justify-end mt-4">
            <CreateClassDialog semesterId={semesterId} />
          </div>
          <div className="mt-6">
            <ClassTable classes={classesData.data} />
          </div>
          <div className="mt-8 mb-8 flex justify-end">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={`?page=${currentPage - 1}`} />
                  </PaginationItem>
                )}
                {Array.from(
                  { length: classesData.totalPages },
                  (_, i) => i + 1
                ).map((pageNumber) => {
                  if (
                    pageNumber === 1 ||
                    pageNumber === classesData.totalPages ||
                    (pageNumber >= currentPage - 1 &&
                      pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href={`?page=${pageNumber}`}
                          isActive={pageNumber === currentPage}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                {currentPage < classesData.totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`?page=${currentPage + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}
