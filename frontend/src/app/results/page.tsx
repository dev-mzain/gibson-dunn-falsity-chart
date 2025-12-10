'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ResultsStep from '@/components/ResultsStep';
import { AllegationRow, ProcessingResult } from '@/types';
import { parseMarkdownTable } from '@/lib/api';
import { clearStoredFile } from '@/lib/storage';

export default function ResultsPage() {
  const router = useRouter();
  const [allegations, setAllegations] = useState<AllegationRow[]>([]);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the processing result from sessionStorage
    const storedResult = sessionStorage.getItem('processingResult');
    
    if (!storedResult) {
      // No result found, redirect to upload
      router.push('/upload');
      return;
    }

    try {
      const result: ProcessingResult = JSON.parse(storedResult);
      setProcessingResult(result);

      // Parse the markdown table into structured data
      const parsedData = parseMarkdownTable(result.final_chart);
      
      // Convert to AllegationRow format
      const allegationRows: AllegationRow[] = parsedData.map((row) => ({
        paragraph: row.paragraph,
        date: row.date,
        speaker: row.speaker,
        context: row.context,
        misstatement: row.misstatement,
        falsityReason: row.falsityReason,
        falsitySummary: row.falsitySummary,
      }));

      setAllegations(allegationRows);
      
      // Clear stored file data
      clearStoredFile();
    } catch (error) {
      console.error('Error parsing results:', error);
      router.push('/upload');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="text-gray-500">Loading results...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center p-6 relative">
        <ResultsStep
          allegations={allegations}
          processingResult={processingResult}
        />
      </main>
    </div>
  );
}