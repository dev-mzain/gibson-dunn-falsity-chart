import { FileText, Sheet, CheckCircle, AlertTriangle } from 'lucide-react';
import { AllegationRow, ProcessingResult } from '@/types';

interface ResultsStepProps {
  allegations: AllegationRow[];
  processingResult?: ProcessingResult | null;
}

export default function ResultsStep({ allegations, processingResult }: ResultsStepProps) {
  const getFalsityTypeColor = (type: AllegationRow['falsityType']) => {
    switch (type) {
      case 'Omission':
        return 'bg-red-50 text-red-700';
      case 'Misleading':
        return 'bg-amber-50 text-amber-700';
      case 'False Statement':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-enter pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {processingResult?.status === 'approved' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 uppercase tracking-wide border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Approved
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 uppercase tracking-wide border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Max Iterations
              </span>
            )}
            {processingResult && (
              <span className="text-xs text-gray-400">
                {processingResult.iterations} iteration{processingResult.iterations > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-medium tracking-tight text-gray-900">
            Falsity Chart Analysis
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Generated {allegations.length} allegation{allegations.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <FileText className="h-4 w-4 text-blue-600" />
            Export to Word
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <Sheet className="h-4 w-4 text-emerald-600" />
            Export to Excel
          </button>
          <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 shadow-sm transition-all">
            Save to Matter
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">
                  Para #
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                  Date
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">
                  Speaker / Context
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/3">
                  Alleged Misstatement
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/3">
                  Reasons for Falsity (Plaintiff)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {allegations.map((allegation, index) => (
                <tr
                  key={index}
                  className="group hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4 px-4 align-top text-gray-500 font-mono text-xs">
                    {allegation.paragraph}
                  </td>
                  <td className="py-4 px-4 align-top text-gray-900 font-medium">
                    {allegation.date}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="font-medium text-gray-900">
                      {allegation.speaker}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {allegation.context}
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="p-3 bg-gray-50 rounded border border-gray-100 italic text-gray-700 leading-relaxed">
                      {allegation.misstatement}
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="text-gray-600 leading-relaxed">
                      {allegation.falsityType && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mb-2 ${getFalsityTypeColor(
                            allegation.falsityType
                          )}`}
                        >
                          {allegation.falsityType}
                        </span>
                      )}
                      <p>{allegation.falsityReason}</p>
                      {allegation.falsitySummary && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Summary: {allegation.falsitySummary}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}