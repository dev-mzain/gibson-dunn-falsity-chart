'use client';

import { ScanLine, Quote, Users, Table2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { ProcessingResult } from '@/types';
import { processComplaint, APIError } from '@/lib/api';
import { getStoredFile } from '@/lib/storage';

interface ProcessingStepProps {
  onComplete: (result: ProcessingResult) => void;
}

type StepStatus = 'pending' | 'active' | 'completed' | 'error';

interface Step {
  id: string;
  icon: string;
  text: string;
  status: StepStatus;
  estimatedDuration: number; // seconds
}

const getIcon = (iconName: string, isActive: boolean = false) => {
  const iconProps = {
    className: `h-3 w-3 ${isActive ? 'animate-pulse' : ''}`,
    strokeWidth: 1.5
  };
  switch (iconName) {
    case 'scan-line':
      return <ScanLine {...iconProps} />;
    case 'quote':
      return <Quote {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'table-2':
      return <Table2 {...iconProps} />;
    case 'loader':
      return <Loader2 {...iconProps} className="h-3 w-3 animate-spin" />;
    default:
      return null;
  }
};

// Estimated step durations based on typical processing times
const STEP_DURATIONS = {
  generating: 60,  // ~60 seconds for chart generation
  reviewing: 45,   // ~45 seconds for review
  fixing: 30,      // ~30 seconds for fixes (may not happen)
  finalizing: 5,   // ~5 seconds for finalization
};

export default function ProcessingStep({ onComplete }: ProcessingStepProps) {
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState('Initializing...');
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { id: 'generating', icon: 'scan-line', text: 'Agent 1: Generating initial falsity chart', status: 'pending', estimatedDuration: STEP_DURATIONS.generating },
    { id: 'reviewing', icon: 'quote', text: 'Agent 2: Reviewing chart for accuracy', status: 'pending', estimatedDuration: STEP_DURATIONS.reviewing },
    { id: 'fixing', icon: 'users', text: 'Agent 3: Fixing identified issues (if needed)', status: 'pending', estimatedDuration: STEP_DURATIONS.fixing },
    { id: 'finalizing', icon: 'table-2', text: 'Finalizing falsity chart', status: 'pending', estimatedDuration: STEP_DURATIONS.finalizing },
  ]);
  
  // Ref to prevent double API calls in React StrictMode
  const hasStartedProcessing = useRef(false);
  const resultRef = useRef<ProcessingResult | null>(null);

  const updateStepStatus = (stepId: string, status: StepStatus) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ));
  };

  // Simulate progress based on elapsed time
  useEffect(() => {
    if (isProcessingComplete) return;
    
    const totalEstimatedTime = STEP_DURATIONS.generating + STEP_DURATIONS.reviewing + STEP_DURATIONS.fixing + STEP_DURATIONS.finalizing;
    
    // Update step statuses based on elapsed time
    if (timer < STEP_DURATIONS.generating) {
      updateStepStatus('generating', 'active');
      setCurrentMessage('Agent 1: Analyzing complaint and generating falsity chart...');
    } else if (timer < STEP_DURATIONS.generating + STEP_DURATIONS.reviewing) {
      updateStepStatus('generating', 'completed');
      updateStepStatus('reviewing', 'active');
      setCurrentMessage('Agent 2: Reviewing chart for accuracy and completeness...');
    } else if (timer < STEP_DURATIONS.generating + STEP_DURATIONS.reviewing + STEP_DURATIONS.fixing) {
      updateStepStatus('reviewing', 'completed');
      updateStepStatus('fixing', 'active');
      setCurrentMessage('Agent 3: Applying fixes based on review feedback...');
    } else if (timer < totalEstimatedTime) {
      updateStepStatus('fixing', 'completed');
      updateStepStatus('finalizing', 'active');
      setCurrentMessage('Finalizing and preparing results...');
    }
    // After estimated time, keep showing finalizing as active until actual completion
  }, [timer, isProcessingComplete]);

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

        // Start timer
        timerInterval = setInterval(() => {
          setTimer((prev) => prev + 1);
        }, 1000);

        setCurrentMessage('Starting processing...');

        // Process using regular endpoint (more reliable than SSE)
        const result = await processComplaint(file);
        resultRef.current = result;
        
        // Mark processing as complete
        setIsProcessingComplete(true);
        
        // Mark all steps as complete
        setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as StepStatus })));
        setCurrentMessage('Processing complete!');

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

  // Calculate progress based on completed steps
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const activeCount = steps.filter(s => s.status === 'active').length;
  const progress = Math.round(((completedCount + activeCount * 0.5) / steps.length) * 100);

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
        
        <p className="text-xs text-blue-600 mb-6 font-medium">
          {currentMessage}
        </p>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Step List */}
        <div className="space-y-4">
          {steps.map((step) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isError = step.status === 'error';
            
            return (
              <div key={step.id} className="flex items-center gap-4 group">
                <div
                  className={`h-6 w-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                    isCompleted
                      ? 'bg-gray-900 border-gray-900'
                      : isActive
                      ? 'bg-blue-500 border-blue-500'
                      : isError
                      ? 'bg-red-500 border-red-500'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={isCompleted || isActive || isError ? 'text-white' : 'text-gray-400'}>
                    {isActive ? getIcon('loader', true) : getIcon(step.icon)}
                  </div>
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isCompleted
                        ? 'text-gray-900'
                        : isActive
                        ? 'text-blue-600'
                        : isError
                        ? 'text-red-600'
                        : 'text-gray-400'
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