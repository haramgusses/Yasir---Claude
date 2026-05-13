"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, Upload, File, Trash2, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import {
  createOrderSchema,
  type CreateOrderInput,
  SHIPMENT_TYPES,
} from "@/lib/validations";
import { formatBytes, getDocType, getFileExtension } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const ACCEPTED_TYPES = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".txt",
  ".csv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
];

export default function CreateOrderModal({ onClose, onCreated }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
  });

  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onUploadProgress: (p) => setUploadProgress(p),
  });

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const valid = arr.filter((f) => {
      const ext = "." + getFileExtension(f.name);
      return ACCEPTED_TYPES.includes(ext) && f.size <= 50 * 1024 * 1024;
    });
    if (valid.length !== arr.length) {
      toast.warning("Some files were skipped (unsupported type or >50MB)");
    }
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const onSubmit = async (data: CreateOrderInput) => {
    setIsSubmitting(true);
    try {
      let docs: CreateOrderInput["docs"] = [];

      if (files.length > 0) {
        const uploaded = await startUpload(files);
        if (!uploaded || uploaded.length === 0) {
          toast.error("File upload failed. Please try again.");
          return;
        }
        docs = uploaded.map((f, i) => ({
          name: f.name,
          size: files[i]?.size ?? 0,
          mimeType: files[i]?.type ?? "application/octet-stream",
          extension: getFileExtension(f.name),
          docType: getDocType(f.name),
          fileUrl: f.url,
        }));
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, docs }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success("Shipment created successfully");
      onCreated();
      router.push(`/dashboard/orders/${result.data.id}`);
    } catch (err) {
      toast.error("Failed to create shipment. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const overLimit = totalSize > 200 * 1024 * 1024;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-navy border border-navy/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-navy border-b border-navy/80 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-white font-semibold text-lg">New Shipment</h2>
            <p className="text-silver text-xs">Fill in the details and attach documents</p>
          </div>
          <button
            onClick={onClose}
            className="text-silver hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Order Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-silver text-xs font-medium uppercase tracking-wide mb-1.5">
                Order Reference <span className="text-burgundy">*</span>
              </label>
              <input
                {...register("orderRef")}
                placeholder="e.g. ORD-2024-00142"
                className="w-full bg-app-black border border-navy/80 rounded-lg px-3 py-2 text-sm text-white placeholder:text-silver/40 focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy"
              />
              {errors.orderRef && (
                <p className="text-burgundy text-xs mt-1">
                  {errors.orderRef.message}
                </p>
              )}
            </div>

            {/* Shipment Type */}
            <div>
              <label className="block text-silver text-xs font-medium uppercase tracking-wide mb-1.5">
                Shipment Type <span className="text-burgundy">*</span>
              </label>
              <select
                {...register("shipmentType")}
                className="w-full bg-app-black border border-navy/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy"
              >
                <option value="">Select type...</option>
                {SHIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.shipmentType && (
                <p className="text-burgundy text-xs mt-1">
                  {errors.shipmentType.message}
                </p>
              )}
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-silver text-xs font-medium uppercase tracking-wide mb-1.5">
              Recipient <span className="text-burgundy">*</span>
            </label>
            <input
              {...register("recipient")}
              placeholder="Company or person name"
              className="w-full bg-app-black border border-navy/80 rounded-lg px-3 py-2 text-sm text-white placeholder:text-silver/40 focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy"
            />
            {errors.recipient && (
              <p className="text-burgundy text-xs mt-1">
                {errors.recipient.message}
              </p>
            )}
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-silver text-xs font-medium uppercase tracking-wide mb-1.5">
              Expiry Date{" "}
              <span className="text-silver/40 normal-case font-normal">
                (optional — controls when public QR stops working)
              </span>
            </label>
            <input
              {...register("expiresAt")}
              type="datetime-local"
              className="w-full bg-app-black border border-navy/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy"
            />
            {errors.expiresAt && (
              <p className="text-burgundy text-xs mt-1">
                {errors.expiresAt.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-silver text-xs font-medium uppercase tracking-wide mb-1.5">
              Notes{" "}
              <span className="text-silver/40 normal-case font-normal">
                (optional)
              </span>
            </label>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="Handling instructions, special requirements..."
              className="w-full bg-app-black border border-navy/80 rounded-lg px-3 py-2 text-sm text-white placeholder:text-silver/40 focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-silver text-xs font-medium uppercase tracking-wide mb-1.5">
              Documents
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-burgundy bg-burgundy/10"
                  : "border-navy/80 hover:border-silver/30 bg-app-black"
              }`}
            >
              <Upload className="h-6 w-6 text-silver/40 mx-auto mb-2" />
              <p className="text-silver text-sm">
                Drop files here or{" "}
                <span className="text-burgundy font-medium">browse</span>
              </p>
              <p className="text-silver/40 text-xs mt-1">
                PDF, PNG, JPG, TXT, CSV, DOC, XLS — max 50MB per file, 200MB
                total
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-app-black rounded-lg px-3 py-2 border border-navy/60"
                  >
                    <File className="h-4 w-4 text-silver/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs truncate">{file.name}</p>
                      <p className="text-silver/50 text-xs">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-silver/40 hover:text-burgundy transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-silver/50">
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </span>
                  <span
                    className={overLimit ? "text-burgundy" : "text-silver/50"}
                  >
                    {formatBytes(totalSize)} / 200 MB
                  </span>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-silver mb-1">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-app-black rounded-full overflow-hidden">
                  <div
                    className="h-full bg-burgundy rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-app-black border border-navy/80 hover:border-silver/30 text-silver hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || overLimit}
              className="flex-1 bg-burgundy hover:bg-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
