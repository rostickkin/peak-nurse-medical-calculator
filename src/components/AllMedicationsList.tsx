import { ChevronRight, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Medication } from '../types/medication';
import { CATEGORY_META, getCategoryGroup, isMedicationWithdrawn, filterMedicationsByPrefixSearch } from '../utils/calculationEngine';

interface AllMedicationsListProps {
  medications: Medication[];
  search: string;
  selectedCategory: string;
  onSelectMedication: (id: string) => void;
}

export const AllMedicationsList = ({
  medications,
  search,
  selectedCategory,
  onSelectMedication
}: AllMedicationsListProps) => {
  const { t } = useTranslation();

  // Filter meds based on search & category
  const filteredMeds = filterMedicationsByPrefixSearch(medications, search, selectedCategory);

  // Group filtered meds alphabetically
  const alphabeticalGroups: Record<string, Medication[]> = {};
  filteredMeds.forEach(med => {
    const letter = med.genericName[0].toUpperCase();
    if (!alphabeticalGroups[letter]) alphabeticalGroups[letter] = [];
    alphabeticalGroups[letter].push(med);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider">
          {t('all_medications')} ({filteredMeds.length})
        </h2>
      </div>

      {filteredMeds.length === 0 ? (
        <div className="bg-white border border-gray-200/60 rounded-3xl p-8 text-center shadow-sm">
          <p className="text-xs font-bold text-gray-400 mb-1">{t('no_results')}</p>
          <p className="text-[10px] text-gray-300">Try checking spelling or resetting your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(alphabeticalGroups).map(([letter, meds]) => (
            <div key={letter} className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm">
              <div className="text-xs font-black text-blue-600 mb-2 pb-1.5 border-b border-gray-100 tracking-wider">
                {letter}
              </div>
              <div className="divide-y divide-gray-50">
                {meds.map(med => {
                  const style = CATEGORY_META[getCategoryGroup(med.category)] || CATEGORY_META['Others'];
                  const IconComponent = style.icon;
                  const uniqRoutes = [...new Set(med.indications?.flatMap(ind => ind.protocols?.map(p => p.route)))];
                  const withdrawn = isMedicationWithdrawn(med);

                  return (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => onSelectMedication(med.id)}
                      className={`flex items-center gap-3.5 py-3 w-full text-left hover:bg-gray-50/50 px-1 rounded-xl transition active:scale-[0.99] ${
                        withdrawn ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <span className={`p-2 rounded-xl ${withdrawn ? 'bg-rose-100 text-rose-700' : style.badgeBg} flex-shrink-0`}>
                        <IconComponent className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-800 text-xs truncate">{med.genericName}</h4>
                          {withdrawn && (
                            <span className="bg-rose-100 text-rose-700 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                              <AlertTriangle className="w-2.5 h-2.5" /> WITHDRAWN
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                          {med.brandNames?.[0] ? `${med.brandNames[0]} · ` : ''}{getCategoryGroup(med.category)} · {uniqRoutes.join(' / ')}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
