"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStudent } from "@/app/(internal)/(protected)/(sidebar)/students/actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import CreateStudentDialog from "./CreateStudentDialog";

type StudentClassInfo = {
  classItem: {
    id: number;
    name: string;
    semester: { id: number; name: string };
  } | null;
};

type Student = {
  id: number;
  firstName: string;
  lastName: string;
  uid: string;
  email?: string | null;
  walletAddress: string | null;
  createdAt: string;
  studentClasses: StudentClassInfo[];
};

export default function StudentTable({ students }: { students: Student[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    const res = await deleteStudent(id);
    if (res.error) {
      toast.toast({
        title: "Error",
        description: res.error,
        variant: "destructive",
      });
    } else {
      toast.toast({ title: "Deleted", variant: "success" });
      router.refresh();
    }
  };

  const handleEdit = (s: Student) => {
    setEditStudent(s);
    setEditOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500">
                No students yet
              </TableCell>
            </TableRow>
          )}
          {students.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">
                {s.firstName} {s.lastName}
              </TableCell>
              <TableCell>{s.uid}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {s.studentClasses
                    .filter(
                      (
                        sc,
                      ): sc is {
                        classItem: {
                          id: number;
                          name: string;
                          semester: { id: number; name: string };
                        };
                      } => sc.classItem !== null,
                    )
                    .map((sc) => (
                      <Badge key={sc.classItem.id} variant="secondary">
                        {sc.classItem.name}
                      </Badge>
                    ))}
                  {s.studentClasses.length === 0 && (
                    <span className="text-gray-400 text-sm">None</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-gray-500 font-mono">
                  {s.walletAddress
                    ? `${s.walletAddress.slice(0, 6)}...${s.walletAddress.slice(-4)}`
                    : "-"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editStudent && (
        <CreateStudentDialog
          editMode
          studentData={editStudent}
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setEditStudent(null);
          }}
        />
      )}
    </>
  );
}
