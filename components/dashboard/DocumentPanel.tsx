"use client";

import { useState } from "react";
import { FileText, Download, Eye, File, Image } from "lucide-react";
import { formatBytes, isImageType, isPdfType, isTextType } from "@/lib/utils";
import type { Document } from "@prisma/client";

interface Props {
  docs: Document[];
}

function DocIcon({ mimeType }: { mimeType: string }) {
  if (isImageType(mimeType)) return <Image className="h-4 w-4 text-silver/60" />;
  if (isPdfType(mimeType)) return <FileText className="h-4 w-4 text-burgundy/80" />;
  return <File className="h-4 w-4 text-silver/60" />;
}

export default function DocumentPanel({ docs }: Props) {
  const [preview, setPreview] = useState<Document | null>(
    docs[0] ?? null
  );

  if (docs.length === 0) {
    return (
      <div className="bg-navy rounded-xl border border-navy/80 p-8 text-center">
        <FileText className="h-8 w-8 text-silver/20 mx-auto mb-3" />
        <p className="text-silver text-sm">No documents attached</p>
      </div>
    );
  }

  const canPreview = (doc: Document) =>
    isPdfType(doc.mimeType) || isImageType(doc.mimeType) || isTextType(doc.mimeType);

  return (
    <div className="bg-navy rounded-xl border border-navy/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-navy/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-silver/60" />
          <h3 className="text-white font-medium text-sm">Documents</h3>
          <span className="bg-white/10 text-silver text-xs rounded px-1.5 py-0.5">
            {docs.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-navy/60">
        {/* File list */}
        <div className="md:w-56 shrink-0">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setPreview(doc)}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/5 transition-colors ${
                preview?.id === doc.id ? "bg-white/5 border-l-2 border-burgundy" : ""
              }`}
            >
              <DocIcon mimeType={doc.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {doc.name}
                </p>
                <p className="text-silver/50 text-xs flex items-center gap-2 mt-0.5">
                  <span>{doc.docType}</span>
                  <span>·</span>
                  <span>{formatBytes(doc.size)}</span>
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Preview pane */}
        {preview && (
          <div className="flex-1 min-w-0">
            <div className="px-3 py-2 border-b border-navy/60 flex items-center justify-between gap-2">
              <span className="text-silver text-xs truncate">{preview.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                {canPreview(preview) && (
                  <a
                    href={preview.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-silver hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    Open
                  </a>
                )}
                <a
                  href={preview.fileUrl}
                  download={preview.name}
                  className="inline-flex items-center gap-1 bg-burgundy/10 hover:bg-burgundy/20 border border-burgundy/30 text-burgundy text-xs px-2 py-1 rounded transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              </div>
            </div>

            <div className="h-72">
              {isPdfType(preview.mimeType) ? (
                <iframe
                  src={preview.fileUrl}
                  className="w-full h-full"
                  title={preview.name}
                />
              ) : isImageType(preview.mimeType) ? (
                <div className="h-full flex items-center justify-center p-4 bg-app-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
                  <img
                    src={preview.fileUrl}
                    alt={preview.name}
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>
              ) : isTextType(preview.mimeType) ? (
                <iframe
                  src={preview.fileUrl}
                  className="w-full h-full bg-white"
                  title={preview.name}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 bg-app-black/40">
                  <File className="h-10 w-10 text-silver/20" />
                  <p className="text-silver text-sm">No preview available</p>
                  <a
                    href={preview.fileUrl}
                    download={preview.name}
                    className="inline-flex items-center gap-2 bg-burgundy hover:bg-burgundy/90 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
