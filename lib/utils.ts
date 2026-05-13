import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getDocType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("invoice")) return "Invoice";
  if (lower.includes("packing") || lower.includes("pack-list")) return "Packing List";
  if (lower.includes("delivery") || lower.includes("docket")) return "Delivery Note";
  if (lower.includes("cert")) return "Certificate";
  if (lower.includes("manifest")) return "Manifest";
  return "Document";
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isPdfType(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function isTextType(mimeType: string): boolean {
  return mimeType.startsWith("text/");
}
