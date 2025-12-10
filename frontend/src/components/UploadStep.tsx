'use client';

import { FileUp, UploadCloud, Info, ArrowRight, FileCheck, AlertCircle } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { uploadFile, APIError } from '@/lib/api';

interface UploadStepProps {
  onStartProcessing: (file: File) => void;
}

export default function UploadStep({ onStartProcessing }: UploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      
      // Validate file with backend
      setIsValidating(true);
      try {
        await uploadFile(file);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError('Failed to validate file. Please try again.');
        }
        setSelectedFile(null);
      } finally {
        setIsValidating(false);
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleStartProcessing = () => {
    if (selectedFile) {
      onStartProcessing(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto animate-enter my-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
            <FileUp className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
          </div>
        </div>
        <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-2">
          Upload Complaint
        </h2>
        <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
          Upload the plaintiff&apos;s PDF complaint. The AI will extract alleged
          misstatements based on PSLRA specificity requirements.
        </p>

        {/* Dropzone */}
        <div
          className="group relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 p-10 cursor-pointer mb-8"
          onClick={triggerFileUpload}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              {selectedFile ? (
                <FileCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <UploadCloud className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div className="text-center">
              <p className={`text-sm font-medium ${selectedFile ? 'text-emerald-600' : 'text-gray-900'}`}>
                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedFile ? 'File ready for analysis' : 'PDF files up to 100MB'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-left p-4 bg-blue-50/50 rounded-lg border border-blue-100 mb-8">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                Analysis Scope
              </h3>
              <p className="text-xs text-blue-700 mt-0.5">
                Extracts Speaker, Date, Quote, Context, and Reasons for
                Falsity.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Enabled Button */}
        <button
          onClick={handleStartProcessing}
          disabled={!selectedFile || isValidating}
          className={`w-full py-3 px-4 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${
            selectedFile && !isValidating
              ? 'bg-gray-900 hover:bg-gray-800 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <span>{isValidating ? 'Validating...' : 'Analyze Document'}</span>
          {!isValidating && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}