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
  deleteClass,
  updateClass,
} from "@/app/(internal)/(protected)/(sidebar)/classes/actions";
import { getAdminSemesters } from "@/app/(internal)/(protected)/actions";
import { useToast } from "@/hooks/use-toast";
import { NativeModal } from "@/context/NativeDialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";

type ClassItem = {
  id: number;
  name: string;
  semesterId: number;
  createdAt: string;
  semester: {
    name: string;
  } | null;
};

export default function ClassTable({ classes }: { classes: ClassItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSemesterId, setEditSemesterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: semestersData } = useSWR(
    editOpen ? "/api/semesters" : null,
    async () => {
      const res = await getAdminSemesters();
      return res.data;
    },
  );

  const semesters = semestersData ?? [];

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    const res = await deleteClass(id);
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

  const handleEdit = (c: ClassItem) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditSemesterId(c.semesterId);
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editId || !editSemesterId) return;
    setLoading(true);
    const res = await updateClass(editId, {
      name: editName,
      semesterId: editSemesterId,
    }).finally(() => setLoading(false));
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

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500">
                No classes yet
              </TableCell>
            </TableRow>
          )}
          {classes.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{c.semester?.name || "N/A"}</Badge>
              </TableCell>
              <TableCell>
                {new Date(c.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(c)}
                    data-testid={`edit-class-${c.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(c.id)}
                    data-testid={`delete-class-${c.id}`}
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
        className="rounded-2xl w-125!"
      >
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Edit class
            </h1>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter class name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-semester" className="text-sm font-medium">
                Semester
              </label>
              <select
                id="edit-semester"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editSemesterId?.toString() ?? ""}
                onChange={(e) =>
                  setEditSemesterId(Number.parseInt(e.target.value))
                }
              >
                <option value="">Select semester</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id.toString()}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={loading || !editName.trim() || !editSemesterId}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </NativeModal>
    </>
  );
}
