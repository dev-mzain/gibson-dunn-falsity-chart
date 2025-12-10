export interface AllegationRow {
  paragraph: string;
  date: string;
  speaker: string;
  context: string;
  misstatement: string;
  falsityReason: string;
  falsityType?: 'Omission' | 'Misleading' | 'False Statement';
  falsitySummary?: string;
}

export type ProcessingStep = 'upload' | 'processing' | 'results';

export interface ProcessingStepItem {
  id: string;
  icon: string;
  text: string;
  delay: number;
}

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