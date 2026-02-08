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
import {
  deleteSemester,
  updateSemester,
} from "@/app/(internal)/(protected)/(sidebar)/semesters/actions";
import { useToast } from "@/hooks/use-toast";
import { NativeModal } from "@/context/NativeDialog";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Semester = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
};

export default function SemesterTable({
  semesters,
}: {
  semesters: Semester[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this semester?")) return;
    const res = await deleteSemester(id);
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

  const handleEdit = (s: Semester) => {
    setEditId(s.id);
    setEditName(s.name);
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editId) return;
    setLoading(true);
    const res = await updateSemester(editId, { name: editName }).finally(() =>
      setLoading(false)
    );
    if (res.error) {
      toast.toast({
        title: "Error",
        description: res.error,
        variant: "destructive",
      });
    } else {
      toast.toast({ title: "Updated", variant: "success" });
      setEditOpen(false);
      router.refresh();
    }
  };

  const handleToggleActive = async (s: Semester) => {
    const res = await updateSemester(s.id, { isActive: !s.isActive });
    if (res.error) {
      toast.toast({
        title: "Error",
        description: res.error,
        variant: "destructive",
      });
    } else {
      router.refresh();
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {semesters.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500">
                No semesters yet
              </TableCell>
            </TableRow>
          )}
          {semesters.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <Link
                  href={`/semesters/${s.id}`}
                  className="font-medium hover:underline"
                >
                  {s.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge
                  variant={s.isActive ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => handleToggleActive(s)}
                >
                  {s.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>{new Date(s.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(s)}
                    data-testid={`edit-semester-${s.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(s.id)}
                    data-testid={`delete-semester-${s.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <NativeModal
        openModal={editOpen}
        closeModal={() => setEditOpen(false)}
        className="rounded-2xl w-[500px]"
      >
        <div className="space-y-6 p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit semester
          </h1>
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} loading={loading}>
              Save
            </Button>
          </div>
        </div>
      </NativeModal>
    </>
  );
}
