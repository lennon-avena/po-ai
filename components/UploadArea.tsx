import React, { useState } from 'react';
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { Upload, File } from 'lucide-react';

interface UploadAreaProps {
  endpoint: "imageUploader" | "htmlUploader";
  onClientUploadComplete: (res: any[]) => void;
  onUploadError: (error: Error) => void;
  acceptedFileTypes: string;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  endpoint,
  onClientUploadComplete,
  onUploadError,
  acceptedFileTypes
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        Arraste e solte seu arquivo aqui, ou
      </p>
      <UploadButton<OurFileRouter>
        endpoint={endpoint}
        onClientUploadComplete={onClientUploadComplete}
        onUploadError={onUploadError}
        className="mt-2 ut-button:bg-blue-500 ut-button:hover:bg-blue-600 ut-button:active:bg-blue-700 ut-button:disabled:bg-blue-300 ut-button:disabled:cursor-not-allowed ut-button:transition-colors ut-button:duration-200 ut-button:text-white ut-allowed-content:text-black ut-allowed-content:font-semibold ut-allowed-content:!important"
      />
      <p className="mt-2 text-xs text-gray-500">
        {acceptedFileTypes}
      </p>
    </div>
  );
};

export default UploadArea;
