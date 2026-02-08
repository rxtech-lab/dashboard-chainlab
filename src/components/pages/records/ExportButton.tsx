"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ExportButton() {
  const searchParams = useSearchParams();

  const handleExport = () => {
    const params = new URLSearchParams();
    const semesterId = searchParams.get("semesterId");
    const classId = searchParams.get("classId");
    if (semesterId) params.set("semesterId", semesterId);
    if (classId) params.set("classId", classId);
    window.location.href = `/records/export?${params.toString()}`;
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      className="flex items-center gap-2"
      data-testid="export-csv-button"
    >
      <Download className="h-4 w-4" /> Export CSV
    </Button>
  );
}
