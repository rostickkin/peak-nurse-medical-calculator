import { useState, useRef, useEffect } from 'react';
import { Search, ChevronRight, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Medication } from '../types/medication';
import { CATEGORY_META, getCategoryGroup, filterMedicationsByPrefixSearch, isMedicationWithdrawn } from '../utils/calculationEngine';

interface SearchBannerProps {
  search: string;
  setSearch: (val: string) => void;
  medications: Medication[];
  onSelectMedication: (id: string) => void;
}

export const SearchBanner = ({ search, setSearch, medications, onSelectMedication }: SearchBannerProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = filterMedicationsByPrefixSearch(medications, search).slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (medId: string) => {
    onSelectMedication(medId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder={t('search_placeholder')}
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) {
              handleSelect(suggestions[0].id);
            }
          }}
          className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl pl-12 pr-10 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
        />
        {search && (
          <button 
            type="button" 
            onClick={() => {
              setSearch('');
              setIsOpen(false);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black bg-gray-100 hover:bg-gray-200 text-gray-500 px-2 py-1 rounded-md transition uppercase"
          >
            CLEAR
          </button>
        )}
      </div>

      {isOpen && search.trim().length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-gray-50">
          <div className="px-3 py-2 bg-slate-50 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>{t('suggestions_matching')} "{search.trim()}"</span>
            <span>{suggestions.length} {t('found')}</span>
          </div>

          {suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs font-semibold text-gray-400">
              {t('no_meds_found')} "{search}"
            </div>
          ) : (
            suggestions.map(med => {
              const catGroup = getCategoryGroup(med.category);
              const style = CATEGORY_META[catGroup] || CATEGORY_META['Others'];
              const IconComponent = style.icon;
              const withdrawn = isMedicationWithdrawn(med);

              return (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => handleSelect(med.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50/60 flex items-center justify-between transition group ${
                    withdrawn ? 'bg-rose-50/40 hover:bg-rose-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`p-1.5 rounded-lg ${withdrawn ? 'bg-rose-100 text-rose-700' : style.badgeBg} text-xs flex-shrink-0`}>
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-gray-900 truncate">
                          {med.genericName}
                        </span>
                        {withdrawn && (
                          <span className="bg-rose-100 text-rose-700 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> WITHDRAWN
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-gray-400 truncate mt-0.5">
                        {med.brandNames?.[0] ? `${med.brandNames[0]} · ` : ''}{med.activeIngredient}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition flex-shrink-0 ml-2" />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
