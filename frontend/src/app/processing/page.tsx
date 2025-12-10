'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProcessingStep from '@/components/ProcessingStep';
import { ProcessingResult } from '@/types';

export default function ProcessingPage() {
  const router = useRouter();

  const handleProcessingComplete = (result: ProcessingResult) => {
    // Store the result for the results page
    sessionStorage.setItem('processingResult', JSON.stringify(result));
    router.push('/results');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center p-6 relative">
        <ProcessingStep onComplete={handleProcessingComplete} />
      </main>
    </div>
  );
}