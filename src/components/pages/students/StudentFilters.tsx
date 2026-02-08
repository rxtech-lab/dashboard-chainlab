"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  getSemestersForFilter,
  getClassesForFilter,
} from "@/app/(internal)/(protected)/(sidebar)/students/actions";

export default function StudentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [semesters, setSemesters] = useState<{ id: number; name: string }[]>(
    []
  );
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);

  const semesterId = searchParams.get("semesterId") ?? "";
  const classId = searchParams.get("classId") ?? "";

  useEffect(() => {
    getSemestersForFilter().then((res) => setSemesters(res.data));
  }, []);

  useEffect(() => {
    if (semesterId) {
      getClassesForFilter(Number.parseInt(semesterId)).then((res) =>
        setClasses(res.data)
      );
    } else {
      setClasses([]);
    }
  }, [semesterId]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page when filtering
    params.delete("page");
    // If changing semester, reset class
    if (key === "semesterId") {
      params.delete("classId");
    }
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("?");
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select
        value={semesterId}
        onValueChange={(v) => updateFilter("semesterId", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All semesters" />
        </SelectTrigger>
        <SelectContent>
          {semesters.map((s) => (
            <SelectItem key={s.id} value={s.id.toString()}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {semesterId && classes.length > 0 && (
        <Select
          value={classId}
          onValueChange={(v) => updateFilter("classId", v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(semesterId || classId) && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
