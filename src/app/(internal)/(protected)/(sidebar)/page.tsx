import { AttendanceRoomList } from "@/components/pages/attendance/AttendanceList";
import { Config } from "@/config/config";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getAttendanceRooms } from "../actions";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const CreateRoomDialog = dynamic(
  () => import("@/components/pages/CreateRoomDialog"),
  {
    ssr: !!false,
  }
);

export const metadata: Metadata = {
  title: "Home",
  description: "Home",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = params.page ? Number.parseInt(params.page) : 1;
  const data = await getAttendanceRooms(currentPage, Config.App.pageLimit);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div
          className="mx-auto w-full px-4 lg:px-6"
          data-testid="attendance-rooms-list"
        >
          <div className="flex justify-end">
            <CreateRoomDialog />
          </div>
          <div className="mt-6">
            <AttendanceRoomList rooms={data.data} />
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
                    // Show first page, current page, last page, and pages around current
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
                    // Show ellipsis if there's a gap
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
                  }
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
