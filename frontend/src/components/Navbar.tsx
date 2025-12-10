import { Scale } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md px-6 py-4">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-900 text-white shadow-sm">
            <Scale strokeWidth={1.5} className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-gray-900">
              Gibson Intelligence
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Falsity Extractor Module v1.0
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-600">
              System Operational
            </span>
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
            JD
          </div>
        </div>
      </div>
    </nav>
  );
}