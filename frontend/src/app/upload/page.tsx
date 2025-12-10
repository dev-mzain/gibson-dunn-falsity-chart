'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import UploadStep from '@/components/UploadStep';
import { storeFileData } from '@/lib/storage';

export default function UploadPage() {
  const router = useRouter();

  const handleStartProcessing = (file: File) => {
    // Store file data for processing page
    storeFileData(file);
    router.push('/processing');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center p-6 relative">
        <UploadStep onStartProcessing={handleStartProcessing} />
      </main>
    </div>
  );
}