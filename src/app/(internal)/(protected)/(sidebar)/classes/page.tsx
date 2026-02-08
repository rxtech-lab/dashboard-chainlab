import { Config } from "@/config/config";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getClasses } from "./actions";
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
  { ssr: !!false },
);

const ClassTable = dynamic(
  () => import("@/components/pages/classes/ClassTable"),
  { ssr: !!false },
);

export const metadata: Metadata = {
  title: "Classes",
  description: "Manage classes",
};

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = params.page ? Number.parseInt(params.page) : 1;
  const data = await getClasses(currentPage, Config.App.pageLimit);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="mx-auto w-full px-4 lg:px-6">
          <div className="flex justify-end">
            <CreateClassDialog />
          </div>
          <div className="mt-6">
            <ClassTable classes={data.data} />
          </div>
          <div className="mt-8 mb-8 flex justify-end">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={`?page=${currentPage - 1}`} />
                  </PaginationItem>
                )}
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                  (pageNumber) => {
                    if (
                      pageNumber === 1 ||
                      pageNumber === data.totalPages ||
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
                  },
                )}
                {currentPage < data.totalPages && (
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
