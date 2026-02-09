"use client";

import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importStudentsFromCSV } from "@/app/(internal)/(protected)/(sidebar)/students/actions";

type ImportResult = {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: Record<string, unknown> }>;
};
import { getAllClasses } from "@/app/(internal)/(protected)/(sidebar)/classes/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Combobox } from "@headlessui/react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function ImportStudentsDialog({
  isOpen: controlledOpen,
  onClose,
}: Props = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      if (!value && onClose) onClose();
    } else {
      setInternalOpen(value);
    }
  };

  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();

  const { data: classesData } = useSWR(
    open ? "/api/classes/all" : null,
    async () => {
      const res = await getAllClasses();
      return res.data;
    },
  );

  const classes = classesData ?? [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
      setImportResults(null);
    } else {
      toast.toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    console.log(
      "Starting import with file:",
      selectedFile,
      "and classId:",
      selectedClassId,
    );
    if (!selectedFile) {
      toast.toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    toast.toast({
      title: "Importing students...",
      description: "Please wait while we process your CSV file",
    });

    try {
      const csvContent = await selectedFile.text();
      const results = await importStudentsFromCSV(
        csvContent,
        selectedClassId || undefined,
      );

      setImportResults(results);

      if (results.success && results.imported > 0) {
        toast.toast({
          title: "Import completed",
          description: `Successfully imported ${results.imported} student(s)${results.failed > 0 ? `, ${results.failed} failed` : ""}`,
          variant: results.failed > 0 ? "default" : "success",
        });
        router.refresh();
      } else {
        toast.toast({
          title: "Import failed",
          description: "No students were imported. Check the error details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast.toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to import students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedClassId(null);
    setImportResults(null);
    setOpen(false);
  };

  const downloadTemplate = () => {
    const template =
      "firstname,lastname,uid,email,walletaddress\nJohn,Doe,12345,john.doe@example.com,0x1234567890abcdef\nJane,Smith,67890,jane.smith@example.com,";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          data-testid="import-students-button"
        >
          <Upload className="h-4 w-4" /> Import from CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple students at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* CSV Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 text-sm mb-1">
                  CSV Format
                </h3>
                <p className="text-xs text-blue-700 mb-2">
                  Required columns: <code>firstname</code>,{" "}
                  <code>lastname</code>, <code>uid</code>
                  <br />
                  Optional columns: <code>email</code>,{" "}
                  <code>walletaddress</code>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="h-7 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" /> Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* Class Selection */}
          <div>
            <div className="text-sm font-medium mb-2 block">
              Assign to Class (optional)
            </div>
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No classes available. Students will be imported without class
                assignment.
              </p>
            ) : (
              <Combobox value={selectedClassId} onChange={setSelectedClassId}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    displayValue={() =>
                      selectedClass
                        ? `${selectedClass.name} (${selectedClass.semester?.name})`
                        : "No class (optional)"
                    }
                    placeholder="Select a class..."
                    readOnly
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Combobox.Button>
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <Combobox.Option
                      value={null}
                      className={({ active }) =>
                        cn(
                          "relative cursor-pointer select-none py-2 px-4",
                          active
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground",
                        )
                      }
                    >
                      No class (optional)
                    </Combobox.Option>
                    {classes.map((classItem) => (
                      <Combobox.Option
                        key={classItem.id}
                        value={classItem.id}
                        className={({ active }) =>
                          cn(
                            "relative cursor-pointer select-none py-2 px-4",
                            active
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground",
                          )
                        }
                      >
                        {classItem.name} ({classItem.semester?.name})
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
            )}
          </div>

          {/* File Upload */}
          <div>
            <div className="text-sm font-medium mb-2 block">CSV File</div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="csv-file-input"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? selectedFile.name : "Choose CSV file"}
              </Button>
            </div>
          </div>

          {/* Import Results */}
          {importResults && (
            <div
              className={cn(
                "rounded-lg p-4 border",
                importResults.imported > 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200",
              )}
            >
              <div className="flex items-start gap-3">
                {importResults.imported > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3
                    className={cn(
                      "font-medium text-sm mb-2",
                      importResults.imported > 0
                        ? "text-green-900"
                        : "text-red-900",
                    )}
                  >
                    Import Results
                  </h3>
                  <div className="text-xs space-y-1 mb-2">
                    <p
                      className={
                        importResults.imported > 0
                          ? "text-green-700"
                          : "text-red-700"
                      }
                    >
                      Successfully imported: {importResults.imported}
                    </p>
                    {importResults.failed > 0 && (
                      <p className="text-red-700">
                        Failed: {importResults.failed}
                      </p>
                    )}
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-red-900 mb-1">
                        Errors:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResults.errors.map((err, idx) => (
                          <p
                            key={`error-${err.row}-${idx}`}
                            className="text-xs text-red-700"
                          >
                            Row {err.row}: {err.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={handleClose}>
            {importResults ? "Close" : "Cancel"}
          </Button>
          {!importResults && (
            <Button
              onClick={handleImport}
              loading={loading}
              disabled={!selectedFile}
              data-testid="import-confirm-button"
            >
              Import Students
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
