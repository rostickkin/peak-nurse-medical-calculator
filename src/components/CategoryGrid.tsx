import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Medication } from '../types/medication';
import { CATEGORY_META, getCategoryGroup } from '../utils/calculationEngine';

interface CategoryGridProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  medications: Medication[];
}

export const CategoryGrid = ({ selectedCategory, setSelectedCategory, medications }: CategoryGridProps) => {
  const { t } = useTranslation();

  const categoryCounts: Record<string, number> = {};
  Object.keys(CATEGORY_META).forEach(cat => {
    categoryCounts[cat] = medications.filter(m => getCategoryGroup(m.category) === cat).length;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('categories')}</h2>
        {selectedCategory !== 'All' && (
          <button 
            type="button" 
            onClick={() => setSelectedCategory('All')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg"
          >
            All <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2.5">
        {Object.entries(CATEGORY_META).map(([name, style]) => {
          const IconComponent = style.icon;
          const isActive = selectedCategory === name;
          const count = categoryCounts[name] || 0;
          
          return (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedCategory(isActive ? 'All' : name)}
              className={`p-3 border rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 active:scale-[0.98] ${
                isActive 
                  ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/10' 
                  : `${style.borderColor} ${style.bgColor}`
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`p-1 rounded-lg ${isActive ? 'bg-blue-100' : style.badgeBg} text-xs`}>
                  <IconComponent className="w-4 h-4" />
                </span>
                {isActive && <span className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
              <div>
                <p className={`font-bold text-[10px] leading-tight truncate ${isActive ? 'text-blue-900' : style.textColor}`}>
                  {name}
                </p>
                <p className="text-[9px] font-semibold text-gray-400 mt-0.5">
                  {count} {count === 1 ? 'drug' : 'drugs'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
