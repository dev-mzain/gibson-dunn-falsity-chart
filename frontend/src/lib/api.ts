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
  status: 'approved' | 'max_iterations_reached';
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