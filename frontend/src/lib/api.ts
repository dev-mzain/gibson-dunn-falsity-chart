// API service layer for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface IterationData {
  iteration: number;
  chart: string;
  issues: string;
}

export interface ProcessingResult {
  final_chart: string;
  iterations: number;
  history: IterationData[];
  status: 'approved' | 'max_iterations_reached' | 'reviewer_failed' | 'fixer_failed';
}

export interface ProgressUpdate {
  type: 'progress' | 'complete' | 'error';
  step?: string;
  iteration?: number;
  max_iterations?: number;
  message?: string;
  result?: ProcessingResult;
}

export interface UploadResponse {
  message: string;
  filename: string;
  text_length: number;
}

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Upload a file for validation
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new APIError(response.status, error.detail || 'Upload failed');
  }

  return response.json();
}

/**
 * Process a complaint file through the multi-agent workflow
 */
export async function processComplaint(file: File): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/process`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Processing failed' }));
    throw new APIError(response.status, error.detail || 'Processing failed');
  }

  return response.json();
}

/**
 * Process a complaint file with real-time progress updates via SSE
 */
export async function processComplaintWithProgress(
  file: File,
  onProgress: (update: ProgressUpdate) => void
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/process-stream`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Processing failed' }));
    throw new APIError(response.status, error.detail || 'Processing failed');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new APIError(500, 'Failed to get response stream');
  }

  const decoder = new TextDecoder();
  let result: ProcessingResult | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6)) as ProgressUpdate;
            onProgress(data);
            
            if (data.type === 'complete' && data.result) {
              result = data.result;
            } else if (data.type === 'error') {
              throw new APIError(500, data.message || 'Processing failed');
            }
          } catch (e) {
            if (e instanceof APIError) throw e;
            // Ignore JSON parse errors for incomplete chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!result) {
    throw new APIError(500, 'No result received from server');
  }

  return result;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  
  if (!response.ok) {
    throw new APIError(response.status, 'Health check failed');
  }

  return response.json();
}

/**
 * Parse markdown table from chart string into structured data
 */
export function parseMarkdownTable(markdown: string): Array<{
  paragraph: string;
  date: string;
  speaker: string;
  context: string;
  misstatement: string;
  falsityReason: string;
  falsitySummary: string;
}> {
  const lines = markdown.trim().split('\n');
  const data: Array<any> = [];

  // Find the header row and separator
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Para') && lines[i].includes('Date')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return [];

  // Skip header and separator, parse data rows
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) continue;

    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);

    if (cells.length >= 7) {
      data.push({
        paragraph: cells[0],
        date: cells[1],
        speaker: cells[2],
        context: cells[3],
        misstatement: cells[4],
        falsityReason: cells[5],
        falsitySummary: cells[6],
      });
    }
  }

  return data;
}