"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Record = {
  id: number;
  createdAt: string;
  attendant: {
    id: number;
    firstName: string;
    lastName: string;
    uid: string;
    studentClasses: {
      classItem: { id: number; name: string; semester: { name: string } } | null;
    }[];
  } | null;
  attendanceRoom: {
    id: number;
    alias: string;
    semester: { name: string } | null;
  } | null;
};

export default function RecordsTable({ records }: { records: Record[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Student ID</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead>Classes</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-gray-500">
              No attendance records found
            </TableCell>
          </TableRow>
        )}
        {records.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">
              {r.attendant
                ? `${r.attendant.firstName} ${r.attendant.lastName}`
                : "Unknown"}
            </TableCell>
            <TableCell>{r.attendant?.uid ?? "-"}</TableCell>
            <TableCell>{r.attendanceRoom?.alias ?? "-"}</TableCell>
            <TableCell>
              {r.attendanceRoom?.semester?.name ?? "-"}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {r.attendant?.studentClasses
                  ?.filter((sc) => sc.classItem)
                  .map((sc) => (
                    <Badge key={sc.classItem!.id} variant="secondary">
                      {sc.classItem!.name}
                    </Badge>
                  ))}
                {(!r.attendant?.studentClasses ||
                  r.attendant.studentClasses.length === 0) && (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {new Date(r.createdAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
