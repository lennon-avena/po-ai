import { createUploadthing, type FileRouter } from "uploadthing/next";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ file }) => {
      console.log("Image file url", file.url);
      return { fileUrl: file.url };
    }),
  
  htmlUploader: f({ text: { maxFileSize: "1MB" } })
    .onUploadComplete(async ({ file }) => {
      console.log("HTML file url", file.url);
      return { fileUrl: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
