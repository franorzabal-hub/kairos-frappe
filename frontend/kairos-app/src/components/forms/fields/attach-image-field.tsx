/**
 * Attach Image Field Component
 *
 * Image upload field for Frappe "Attach Image" field type
 * Extends AttachField with image preview capabilities
 * Integrates with react-hook-form via Controller
 */

"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useFileUpload,
  formatFileSize,
  FileUploadOptions,
} from "@/hooks/use-file-upload";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface AttachImageFieldProps<T extends FieldValues> {
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
  /** Thumbnail size in pixels */
  thumbnailSize?: number;
}

export function AttachImageField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  readOnly = false,
  error: externalError,
  accept = "image/*",
  description,
  className,
  uploadOptions,
  maxSize,
  thumbnailSize = 150,
}: AttachImageFieldProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    uploadFile,
    progress,
    isUploading,
    error: uploadError,
    reset: resetUpload,
    getFullFileUrl,
  } = useFileUpload();

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const createPreview = useCallback((file: File) => {
    // Revoke previous blob URL if exists
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [previewUrl]);

  const handleFileSelect = useCallback(
    async (
      file: File,
      onChange: (value: string | null) => void
    ) => {
      setLocalError(null);

      // Validate that it's an image
      if (!file.type.startsWith("image/")) {
        setLocalError("Please select an image file");
        return;
      }

      // Validate file size
      if (maxSize && file.size > maxSize) {
        setLocalError("Image size exceeds maximum allowed (" + formatFileSize(maxSize) + ")");
        return;
      }

      setSelectedFile(file);
      createPreview(file);

      try {
        const result = await uploadFile(file, uploadOptions);
        onChange(result.file_url);
        // Update preview to server URL after successful upload
        setPreviewUrl(getFullFileUrl(result.file_url));
      } catch {
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    },
    [maxSize, uploadFile, uploadOptions, createPreview, getFullFileUrl]
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
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setLocalError(null);
      resetUpload();
      onChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [resetUpload, previewUrl]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayError = localError || uploadError || externalError;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error: formError } }) => {
        const currentError = displayError || formError?.message;
        const hasImage = !!value || !!selectedFile;
        const imageUrl = previewUrl || getFullFileUrl(value);

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
                  {/* Show preview while uploading */}
                  {previewUrl && (
                    <div
                      className="relative rounded-lg overflow-hidden bg-muted"
                      style={{
                        width: thumbnailSize,
                        height: thumbnailSize,
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt="Uploading preview"
                        className="w-full h-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
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

              {/* Image Selected State */}
              {!isUploading && hasImage && imageUrl && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="relative group">
                    <div
                      className="rounded-lg overflow-hidden bg-muted border border-border"
                      style={{
                        width: thumbnailSize,
                        height: thumbnailSize,
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt="Uploaded image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleRemove(onChange)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <div className="text-center">
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  )}
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleButtonClick}
                    >
                      Change Image
                    </Button>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!isUploading && !hasImage && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-muted rounded-full">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drag and drop your image here
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
                    <Upload className="h-4 w-4 mr-2" />
                    Select Image
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF, WebP up to {maxSize ? formatFileSize(maxSize) : "10MB"}
                  </p>
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
