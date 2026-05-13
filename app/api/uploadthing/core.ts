import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 20 },
    image: { maxFileSize: "32MB", maxFileCount: 20 },
    "text/plain": { maxFileSize: "32MB", maxFileCount: 20 },
    "text/csv": { maxFileSize: "32MB", maxFileCount: 20 },
    blob: { maxFileSize: "32MB", maxFileCount: 20 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new UploadThingError("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
