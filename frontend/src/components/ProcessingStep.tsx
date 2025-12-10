'use client';

import { ScanLine, Quote, Users, FileSearch, Table2, Check, AlertCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { ProcessingStepItem, ProcessingResult } from '@/types';
import { processComplaint, APIError } from '@/lib/api';
import { getStoredFile } from '@/lib/storage';

const processingSteps: ProcessingStepItem[] = [
  { id: 'proc-step-1', icon: 'scan-line', text: 'Agent 1: Generating initial falsity chart', delay: 1000 },
  { id: 'proc-step-2', icon: 'quote', text: 'Agent 2: Reviewing chart for accuracy', delay: 2000 },
  { id: 'proc-step-3', icon: 'users', text: 'Agent 3: Fixing identified issues', delay: 3000 },
  { id: 'proc-step-4', icon: 'file-search', text: 'Running quality assurance checks', delay: 4000 },
  { id: 'proc-step-5', icon: 'table-2', text: 'Finalizing falsity chart', delay: 5000 },
];

const getIcon = (iconName: string) => {
  const iconProps = { className: 'h-3 w-3', strokeWidth: 1.5 };
  switch (iconName) {
    case 'scan-line':
      return <ScanLine {...iconProps} />;
    case 'quote':
      return <Quote {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'file-search':
      return <FileSearch {...iconProps} />;
    case 'table-2':
      return <Table2 {...iconProps} />;
    default:
      return null;
  }
};

interface ProcessingStepProps {
  onComplete: (result: ProcessingResult) => void;
}

export default function ProcessingStep({ onComplete }: ProcessingStepProps) {
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [currentIteration, setCurrentIteration] = useState(1);
  
  // Ref to prevent double API calls in React StrictMode
  const hasStartedProcessing = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasStartedProcessing.current) {
      return;
    }
    hasStartedProcessing.current = true;
    
    let timerInterval: NodeJS.Timeout;
    
    const processFile = async () => {
      try {
        // Get the stored file
        const file = await getStoredFile();
        if (!file) {
          setError('No file found. Please upload a file first.');
          return;
        }

        // Start progress bar
        setProgress(10);

        // Start timer
        timerInterval = setInterval(() => {
          setTimer((prev) => prev + 1);
        }, 1000);

        // Animate steps as processing happens
        processingSteps.forEach((step, index) => {
          setTimeout(() => {
            setCompletedSteps((prev) => new Set([...prev, step.id]));
            setProgress(20 + (index + 1) * 15);
          }, step.delay);
        });

        // Process the complaint
        const result = await processComplaint(file);
        
        setCurrentIteration(result.iterations);
        setProgress(100);

        // Wait a moment before completing
        setTimeout(() => {
          clearInterval(timerInterval);
          onComplete(result);
        }, 1000);

      } catch (err) {
        clearInterval(timerInterval);
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred during processing.');
        }
      }
    };

    processFile();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto my-auto">
        <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-base font-medium text-gray-900">
              Processing Failed
            </h3>
          </div>
          <p className="text-sm text-red-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/upload'}
            className="w-full py-3 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto my-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium text-gray-900">
            Processing Complaint...
          </h3>
          <span className="text-xs font-mono text-gray-400">
            {formatTime(timer)}
          </span>
        </div>
        
        <p className="text-xs text-gray-500 mb-6">
          Iteration {currentIteration} of 3 (max)
        </p>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gray-900 rounded-full loading-bar-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Step List */}
        <div className="space-y-4">
          {processingSteps.map((step) => {
            const isCompleted = completedSteps.has(step.id);
            return (
              <div key={step.id} className="flex items-center gap-4 group">
                <div
                  className={`h-6 w-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                    isCompleted
                      ? 'bg-gray-900 border-gray-900'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={isCompleted ? 'text-white' : 'text-gray-400'}>
                    {getIcon(step.icon)}
                  </div>
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.text}
                  </p>
                </div>
                <div
                  className={`transition-all duration-300 ${
                    isCompleted
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 translate-x-[-10px]'
                  }`}
                >
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}