import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Medication, Protocol } from '../types/medication';

interface InformationTabProps {
  med: Medication;
  activeProtocol: Protocol | null;
}

export const InformationTab = ({ med, activeProtocol }: InformationTabProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const getLabel = (obj: any) => {
    if (!obj) return '';
    return obj[lang] || obj['en'] || obj['th'] || '';
  };

  return (
    <div className="space-y-4">
      {/* DRUG OVERVIEW CARD */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('med_overview')}</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-400 font-bold block text-[10px] uppercase">{t('generic_name')}</span>
            <span className="font-extrabold text-gray-800">{med.genericName}</span>
          </div>
          <div>
            <span className="text-gray-400 font-bold block text-[10px] uppercase">{t('category_label')}</span>
            <span className="font-extrabold text-gray-800">{med.category}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 font-bold block text-[10px] uppercase">{t('active_ingredient')}</span>
            <span className="font-semibold text-gray-700">{med.activeIngredient}</span>
          </div>
          {med.brandNames && med.brandNames.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-400 font-bold block text-[10px] uppercase">{t('common_brands')}</span>
              <span className="font-semibold text-gray-700">{med.brandNames.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ADJUSTMENT NOTES */}
      {activeProtocol && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('dosing_adjustments')}</h3>
          
          {/* RENAL ADJUSTMENT */}
          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('renal_adj_req')} {activeProtocol.renalAdjustment?.required ? t('yes') : t('no')}</span>
            </div>
            {activeProtocol.renalAdjustment?.note && (
              <p className="text-amber-800/80 text-[11px] font-medium leading-relaxed">
                {getLabel(activeProtocol.renalAdjustment.note)}
              </p>
            )}
          </div>

          {/* HEPATIC ADJUSTMENT */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('hepatic_adj_req')} {activeProtocol.hepaticAdjustment?.required ? t('yes') : t('no')}</span>
            </div>
            {activeProtocol.hepaticAdjustment?.note && (
              <p className="text-blue-800/80 text-[11px] font-medium leading-relaxed">
                {getLabel(activeProtocol.hepaticAdjustment.note)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* PROTOCOL WARNINGS */}
      {activeProtocol?.warnings && activeProtocol.warnings.length > 0 && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('safety_warnings')}</h3>
          <div className="space-y-2">
            {activeProtocol.warnings.map((w, idx) => (
              <div key={idx} className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-xs text-rose-900 font-medium flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{getLabel(w.text)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
