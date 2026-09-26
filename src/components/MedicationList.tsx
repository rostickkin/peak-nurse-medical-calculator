import { useState } from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Medication } from '../types/medication';
import { CATEGORY_META, getCategoryGroup, isMedicationWithdrawn } from '../utils/calculationEngine';

interface MedicationListProps {
  recentIds: string[];
  favoriteIds: string[];
  medications: Medication[];
  onSelectMedication: (id: string) => void;
}

export const MedicationList = ({
  recentIds,
  favoriteIds,
  medications,
  onSelectMedication
}: MedicationListProps) => {
  const { t } = useTranslation();
  const [homeTab, setHomeTab] = useState<'recent' | 'favorites'>('recent');

  const currentListIds = homeTab === 'recent' ? recentIds : favoriteIds;

  return (
    <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm">
      <div className="flex border-b border-gray-100 pb-3 mb-4">
        <button
          type="button"
          onClick={() => setHomeTab('recent')}
          className={`flex-1 pb-2 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all ${
            homeTab === 'recent' 
              ? 'border-blue-600 text-blue-600 font-extrabold' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          {t('recent')}
        </button>
        <button
          type="button"
          onClick={() => setHomeTab('favorites')}
          className={`flex-1 pb-2 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all ${
            homeTab === 'favorites' 
              ? 'border-blue-600 text-blue-600 font-extrabold' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          {t('favorites')}
        </button>
      </div>

      {currentListIds.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs font-bold text-gray-400 mb-1">
            {homeTab === 'recent' ? t('no_recent') : t('no_favorites')}
          </p>
          <p className="text-[10px] text-gray-300">
            {homeTab === 'recent' ? t('no_recent_sub') : t('no_favorites_sub')}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {currentListIds.map(id => {
            const med = medications.find(m => m.id === id);
            if (!med) return null;

            const style = CATEGORY_META[getCategoryGroup(med.category)] || CATEGORY_META['Others'];
            const IconComponent = style.icon;
            const uniqRoutes = [...new Set(med.indications?.flatMap(ind => ind.protocols?.map(p => p.route)))];
            const withdrawn = isMedicationWithdrawn(med);

            return (
              <button
                key={med.id}
                type="button"
                onClick={() => onSelectMedication(med.id)}
                className={`flex items-center gap-3.5 py-3 w-full text-left hover:bg-gray-50/50 px-2 rounded-xl transition active:scale-98 ${
                  withdrawn ? 'bg-rose-50/40' : ''
                }`}
              >
                <span className={`p-2 rounded-xl ${withdrawn ? 'bg-rose-100 text-rose-700' : style.badgeBg}`}>
                  <IconComponent className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800 text-xs truncate">{med.genericName}</h4>
                    {withdrawn && (
                      <span className="bg-rose-100 text-rose-700 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
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
      )}
    </div>
  );
};
