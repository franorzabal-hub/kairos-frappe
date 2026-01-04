/**
 * Attach Field Component
 *
 * File upload field for Frappe "Attach" field type
 * Integrates with react-hook-form via Controller
 */

"use client";

import { useRef, useState, useCallback } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useFileUpload,
  formatFileSize,
  getFileExtension,
  FileUploadOptions,
} from "@/hooks/use-file-upload";
import { Upload, X, File, Loader2 } from "lucide-react";

interface AttachFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  error?: string;
  accept?: string;
  description?: string;
  className?: string;
  /** Upload options for Frappe */
  uploadOptions?: FileUploadOptions;
  /** Maximum file size in bytes */
  maxSize?: number;
}

export function AttachField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  readOnly = false,
  error: externalError,
  accept,
  description,
  className,
  uploadOptions,
  maxSize,
}: AttachFieldProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    uploadFile,
    progress,
    isUploading,
    error: uploadError,
    reset: resetUpload,
  } = useFileUpload();

  const handleFileSelect = useCallback(
    async (
      file: File,
      onChange: (value: string | null) => void
    ) => {
      setLocalError(null);

      // Validate file size
      if (maxSize && file.size > maxSize) {
        setLocalError("File size exceeds maximum allowed (" + formatFileSize(maxSize) + ")");
        return;
      }

      // Validate file type if accept is specified
      if (accept) {
        const acceptedTypes = accept.split(",").map((t) => t.trim());
        const fileType = file.type;
        const fileExtension = "." + getFileExtension(file.name).toLowerCase();

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return fileExtension === type.toLowerCase();
          }
          if (type.endsWith("/*")) {
            return fileType.startsWith(type.replace("/*", "/"));
          }
          return fileType === type;
        });

        if (!isAccepted) {
          setLocalError("File type not accepted. Allowed: " + accept);
          return;
        }
      }

      setSelectedFile(file);

      try {
        const result = await uploadFile(file, uploadOptions);
        onChange(result.file_url);
      } catch {
        setSelectedFile(null);
      }
    },
    [accept, maxSize, uploadFile, uploadOptions]
  );

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      onChange: (value: string | null) => void
    ) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file, onChange);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!readOnly) {
      setIsDragging(true);
    }
  }, [readOnly]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (
      e: React.DragEvent,
      onChange: (value: string | null) => void
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (readOnly) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file, onChange);
      }
    },
    [readOnly, handleFileSelect]
  );

  const handleRemove = useCallback(
    (onChange: (value: string | null) => void) => {
      setSelectedFile(null);
      setLocalError(null);
      resetUpload();
      onChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [resetUpload]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getFileName = (value: string | null | undefined): string => {
    if (!value) return "";
    // Extract filename from URL path
    const parts = value.split("/");
    return parts[parts.length - 1] || value;
  };

  const displayError = localError || uploadError || externalError;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error: formError } }) => {
        const currentError = displayError || formError?.message;
        const hasFile = !!value || !!selectedFile;

        return (
          <div className={cn("space-y-2", className)}>
            <Label
              htmlFor={name}
              className={cn(currentError && "text-destructive")}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, onChange)}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-6 transition-colors",
                isDragging && "border-primary bg-primary/5",
                !isDragging && "border-muted-foreground/25 hover:border-muted-foreground/50",
                currentError && "border-destructive",
                readOnly && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={(e) => handleInputChange(e, onChange)}
                disabled={readOnly || isUploading}
                className="sr-only"
                id={name}
              />

              {/* Uploading State */}
              {isUploading && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: progress + "%" }}
                      />
                    </div>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* File Selected State */}
              {!isUploading && hasFile && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <File className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {selectedFile?.name || getFileName(value)}
                      </span>
                      {selectedFile && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </span>
                      )}
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(onChange)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!isUploading && !hasFile && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-muted rounded-full">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drag and drop your file here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleButtonClick}
                    disabled={readOnly}
                  >
                    Select File
                  </Button>
                  {accept && (
                    <p className="text-xs text-muted-foreground">
                      Accepted: {accept}
                    </p>
                  )}
                </div>
              )}
            </div>

            {description && !currentError && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {currentError && (
              <p className="text-sm text-destructive">{currentError}</p>
            )}
          </div>
        );
      }}
    />
  );
}
