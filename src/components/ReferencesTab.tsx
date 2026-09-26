import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { Medication, Protocol } from '../types/medication';

interface ReferencesTabProps {
  med: Medication;
  activeProtocol: Protocol | null;
}

export const ReferencesTab = ({ med, activeProtocol }: ReferencesTabProps) => {
  const [sourcesOpen, setSourcesOpen] = useState(true);

  return (
    <div className="space-y-4">
      {/* VERIFICATION META STATUS CARD */}
      {med.verificationMeta && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Clinical Verification Meta</h3>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
              med.verificationMeta.clinicalStatus === 'VERIFIED'
                ? 'bg-emerald-100 text-emerald-800'
                : med.verificationMeta.clinicalStatus === 'REJECTED'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {med.verificationMeta.clinicalStatus}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-400 font-bold block text-[10px] uppercase">Thailand Status</span>
              <span className="font-semibold text-gray-800">{med.verificationMeta.thailandStatus}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block text-[10px] uppercase">Verification Date</span>
              <span className="font-semibold text-gray-800">{med.verificationMeta.verificationDate}</span>
            </div>
            {med.verificationMeta.notes && (
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Clinical Notes</span>
                <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5">{med.verificationMeta.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOURCES COLLAPSIBLE CARD */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setSourcesOpen(!sourcesOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Authoritative Sources & Guidelines</h3>
          </div>
          {sourcesOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {sourcesOpen && (
          <div className="pt-2 divide-y divide-gray-50 text-xs">
            {activeProtocol?.sources && activeProtocol.sources.length > 0 ? (
              activeProtocol.sources.map((src, idx) => (
                <div key={idx} className="py-2.5 space-y-0.5">
                  <p className="font-bold text-gray-800">{src.title}</p>
                  <p className="text-[10px] font-semibold text-blue-600">{src.organization}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-xs py-2">FDA SPL Labels, EMA SPCs, Thai NLEM Formulary</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
