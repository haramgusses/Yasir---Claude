"use client";

import { useState } from "react";
import { Download, File, FileText, Eye } from "lucide-react";
import { formatBytes, isImageType, isPdfType, isTextType } from "@/lib/utils";
import type { Document } from "@prisma/client";

interface Props {
  docs: Document[];
}

export default function ScanDocumentViewer({ docs }: Props) {
  const [active, setActive] = useState<Document>(docs[0]);

  if (!active) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Document list */}
        <div className="md:w-72 shrink-0">
          <h2 className="text-silver text-xs font-medium uppercase tracking-wide mb-3">
            Documents ({docs.length})
          </h2>
          <div className="space-y-2">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActive(doc)}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${
                  active.id === doc.id
                    ? "bg-navy border-burgundy/50"
                    : "bg-navy border-navy/80 hover:border-silver/20"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isImageType(doc.mimeType) ? (
                    <Eye className="h-4 w-4 text-silver/60 mt-0.5 shrink-0" />
                  ) : isPdfType(doc.mimeType) ? (
                    <FileText className="h-4 w-4 text-burgundy/70 mt-0.5 shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-silver/60 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {doc.name}
                    </p>
                    <p className="text-silver/50 text-xs mt-0.5 flex items-center gap-1.5">
                      <span>{doc.docType}</span>
                      <span>·</span>
                      <span>{formatBytes(doc.size)}</span>
                    </p>
                  </div>
                </div>
                <a
                  href={doc.fileUrl}
                  download={doc.name}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-burgundy/10 hover:bg-burgundy/20 border border-burgundy/30 text-burgundy text-xs py-1.5 rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </button>
            ))}
          </div>
        </div>

        {/* Preview pane */}
        <div className="flex-1 min-w-0">
          <div className="bg-navy rounded-xl border border-navy/80 overflow-hidden">
            <div className="px-4 py-3 border-b border-navy/60 flex items-center justify-between gap-2">
              <span className="text-silver text-sm truncate font-medium">
                {active.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={active.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-silver hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors hidden sm:inline-flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Open
                </a>
                <a
                  href={active.fileUrl}
                  download={active.name}
                  className="inline-flex items-center gap-1.5 bg-burgundy hover:bg-burgundy/90 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              </div>
            </div>

            <div className="h-[65vh] min-h-[400px]">
              {isPdfType(active.mimeType) ? (
                <iframe
                  src={active.fileUrl}
                  className="w-full h-full"
                  title={active.name}
                />
              ) : isImageType(active.mimeType) ? (
                <div className="h-full flex items-center justify-center p-6 bg-app-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={active.fileUrl}
                    alt={active.name}
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
              ) : isTextType(active.mimeType) ? (
                <iframe
                  src={active.fileUrl}
                  className="w-full h-full bg-white"
                  title={active.name}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 bg-app-black/30">
                  <File className="h-12 w-12 text-silver/20" />
                  <p className="text-silver">No preview for this file type</p>
                  <a
                    href={active.fileUrl}
                    download={active.name}
                    className="inline-flex items-center gap-2 bg-burgundy hover:bg-burgundy/90 text-white px-5 py-2.5 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
