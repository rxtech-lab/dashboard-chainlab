import { Config } from "@/config/config";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getAttendanceRecords } from "./actions";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const RecordsTable = dynamic(
  () => import("@/components/pages/records/RecordsTable"),
  { ssr: !!false }
);

const RecordsFilters = dynamic(
  () => import("@/components/pages/records/RecordsFilters"),
  { ssr: !!false }
);

const ExportButton = dynamic(
  () => import("@/components/pages/records/ExportButton"),
  { ssr: !!false }
);

export const metadata: Metadata = {
  title: "Attendance Records",
  description: "View attendance records",
};

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    semesterId?: string;
    classId?: string;
  }>;
}) {
  const params = await searchParams;
  const currentPage = params.page ? Number.parseInt(params.page) : 1;
  const filters = {
    semesterId: params.semesterId
      ? Number.parseInt(params.semesterId)
      : undefined,
    classId: params.classId ? Number.parseInt(params.classId) : undefined,
  };

  const data = await getAttendanceRecords(
    currentPage,
    Config.App.pageLimit,
    filters
  );

  const buildHref = (page: number) => {
    const p = new URLSearchParams();
    p.set("page", page.toString());
    if (params.semesterId) p.set("semesterId", params.semesterId);
    if (params.classId) p.set("classId", params.classId);
    return `?${p.toString()}`;
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="mx-auto w-full px-4 lg:px-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <RecordsFilters />
            <ExportButton />
          </div>
          <div className="mt-6">
            <RecordsTable records={data.data as any} />
          </div>
          <div className="mt-8 mb-8 flex justify-end">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={buildHref(currentPage - 1)} />
                  </PaginationItem>
                )}
                {Array.from(
                  { length: data.totalPages },
                  (_, i) => i + 1
                ).map((pageNumber) => {
                  if (
                    pageNumber === 1 ||
                    pageNumber === data.totalPages ||
                    (pageNumber >= currentPage - 1 &&
                      pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href={buildHref(pageNumber)}
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
                {currentPage < data.totalPages && (
                  <PaginationItem>
                    <PaginationNext href={buildHref(currentPage + 1)} />
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
