import { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Medication, Protocol, Rule } from '../types/medication';
import { isMedicationWithdrawn } from '../utils/calculationEngine';

interface CalculatorTabProps {
  med: Medication;
  selectedIndicationId: string;
  setSelectedIndicationId: (id: string) => void;
  selectedRoute: string;
  setSelectedRoute: (route: string) => void;
  selectedStrengthId: string;
  setSelectedStrengthId: (id: string) => void;
  age: string;
  setAge: (val: string) => void;
  ageUnit: 'years' | 'months' | 'days';
  setAgeUnit: (unit: 'years' | 'months' | 'days') => void;
  weight: string;
  setWeight: (val: string) => void;
  crcl: string;
  setCrcl: (val: string) => void;
  gender: 'male' | 'female';
  setGender: (g: 'male' | 'female') => void;
  activeProtocol: Protocol | null;
  showResult: boolean;
  validationError: string | null;
  onCalculate: () => void;
  evaluatedDose: number | null;
  evaluatedVolume: number | null;
  formulaSteps: string[];
  matchedRule: Rule | null;
}

export const CalculatorTab = ({
  med,
  selectedIndicationId,
  setSelectedIndicationId,
  selectedRoute,
  setSelectedRoute,
  selectedStrengthId,
  setSelectedStrengthId,
  age,
  setAge,
  ageUnit,
  setAgeUnit,
  weight,
  setWeight,
  crcl,
  setCrcl,
  activeProtocol,
  showResult,
  validationError,
  onCalculate,
  evaluatedDose,
  evaluatedVolume,
  formulaSteps,
  matchedRule
}: CalculatorTabProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isWithdrawn = isMedicationWithdrawn(med);
  const [showCrclInfo, setShowCrclInfo] = useState(false);

  const getLabel = (obj: any) => {
    if (!obj) return '';
    return obj[lang] || obj['en'] || obj['th'] || '';
  };

  const selectedStrength = med.availableStrengths.find(s => s.id === selectedStrengthId);

  // Determine required inputs strictly based on activeProtocol
  const requiredInputsList = activeProtocol?.requiredInputs || [];
  const requiresWeight = requiredInputsList.some(i => i.id === 'weight');
  const requiresCrcl = requiredInputsList.some(i => i.id === 'crcl');
  const requiresAgeInput = requiredInputsList.some(i => i.id === 'age') || 
    (activeProtocol?.ageRange !== undefined && (activeProtocol.ageRange.min !== undefined || activeProtocol.ageRange.max !== undefined)) ||
    activeProtocol?.population === 'pediatric' || 
    activeProtocol?.population === 'neonatal';

  const weightInputDef = requiredInputsList.find(i => i.id === 'weight');
  const crclInputDef = requiredInputsList.find(i => i.id === 'crcl');
  const ageInputDef = requiredInputsList.find(i => i.id === 'age');

  const weightPlaceholder = weightInputDef?.defaultValue ? `e.g. ${weightInputDef.defaultValue}` : 'e.g. 70';
  const crclPlaceholder = crclInputDef?.defaultValue ? `e.g. ${crclInputDef.defaultValue}` : 'e.g. 90';
  const agePlaceholder = ageInputDef?.defaultValue ? `e.g. ${ageInputDef.defaultValue}` : (ageUnit === 'years' ? 'e.g. 32' : ageUnit === 'months' ? 'e.g. 6' : 'e.g. 10');

  const hasAnyInput = requiresAgeInput || requiresWeight || requiresCrcl;

  return (
    <div className="space-y-5">
      {/* WITHDRAWN DRUG CRITICAL WARNING BANNER */}
      {isWithdrawn && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-rose-900 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wide text-rose-700">
              WITHDRAWN MEDICATION (DRUG RECALLED)
            </h3>
            <p className="text-xs font-semibold mt-1 leading-relaxed text-rose-800">
              {lang === 'ru'
                ? 'Этот препарат отозван из клинического обращения (высокий риск опасных примесей). Расчёт дозировок заблокирован.'
                : lang === 'th'
                ? 'ยานี้ถูกยกเลิกการใช้ทั่วโลก ห้ามใช้กับผู้ป่วย ระบบระงับการคำนวณ'
                : 'This medication has been globally recalled/withdrawn. Clinical administration is prohibited and dosage calculations are disabled.'}
            </p>
          </div>
        </div>
      )}

      {/* INDICATION SELECTOR */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          {t('indication')}
        </label>
        <select
          value={selectedIndicationId}
          onChange={(e) => setSelectedIndicationId(e.target.value)}
          disabled={isWithdrawn}
          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
        >
          {med.indications.map(ind => (
            <option key={ind.id} value={ind.id}>
              {getLabel(ind.name)}
            </option>
          ))}
        </select>
      </div>

      {/* PATIENT PARAMETERS (SHOW ONLY RELEVANT INPUTS FOR CURRENT PROTOCOL) */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('patient_info')}</h3>
          {!hasAnyInput && (
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full uppercase">
              {t('fixed_dose_badge')}
            </span>
          )}
        </div>

        {!hasAnyInput ? (
          <div className="bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500 font-medium leading-relaxed">
            {t('fixed_dose_notice')}
          </div>
        ) : (
          <div className="space-y-3">
            {/* AGE INPUT (ONLY IF REQUIRED) */}
            {requiresAgeInput && (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">{t('age')}</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={isWithdrawn}
                    placeholder={agePlaceholder}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 placeholder:text-gray-300 placeholder:font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">{t('unit')}</label>
                  <select
                    value={ageUnit}
                    onChange={(e) => setAgeUnit(e.target.value as any)}
                    disabled={isWithdrawn}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-2 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  >
                    <option value="years">{t('years')}</option>
                    <option value="months">{t('months')}</option>
                    <option value="days">{t('days')}</option>
                  </select>
                </div>
              </div>
            )}

            {/* WEIGHT & CrCl INPUTS (SHOW ONLY IF REQUIRED) */}
            <div className={`grid ${requiresWeight && requiresCrcl ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              {requiresWeight && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">{t('weight')}</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    disabled={isWithdrawn}
                    placeholder={weightPlaceholder}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 placeholder:text-gray-300 placeholder:font-normal"
                  />
                </div>
              )}

              {requiresCrcl && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-400">{t('crcl')}</label>
                    <button
                      type="button"
                      onClick={() => setShowCrclInfo(!showCrclInfo)}
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-0.5 text-[10px] font-extrabold"
                    >
                      <Info className="w-3 h-3" /> CrCl info
                    </button>
                  </div>
                  <input
                    type="number"
                    value={crcl}
                    onChange={(e) => setCrcl(e.target.value)}
                    disabled={isWithdrawn}
                    placeholder={crclPlaceholder}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 placeholder:text-gray-300 placeholder:font-normal"
                  />
                </div>
              )}
            </div>

            {/* CrCl EXPLANATION TOOLTIP/CARD */}
            {requiresCrcl && showCrclInfo && (
              <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3 text-xs text-blue-950 relative">
                <button
                  type="button"
                  onClick={() => setShowCrclInfo(false)}
                  className="absolute right-2 top-2 text-blue-400 hover:text-blue-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <h4 className="font-extrabold text-[11px] uppercase text-blue-800 mb-1">{t('crcl_info_title')}</h4>
                <p className="text-[11px] font-medium leading-relaxed text-blue-900/90">
                  {t('crcl_info_text')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ROUTE & STRENGTH SELECTORS */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        {/* ROUTE */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {t('route_admin')}
          </label>
          <div className="flex gap-2">
            {[...new Set(med.indications.flatMap(i => i.protocols.map(p => p.route)))].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRoute(r)}
                disabled={isWithdrawn}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs border transition ${
                  selectedRoute === r 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-slate-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* STRENGTH / AMPOULE */}
        {med.availableStrengths && med.availableStrengths.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {t('available_strength')}
            </label>
            <select
              value={selectedStrengthId}
              onChange={(e) => setSelectedStrengthId(e.target.value)}
              disabled={isWithdrawn}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            >
              {med.availableStrengths.map(s => (
                <option key={s.id} value={s.id}>
                  {getLabel(s.label)} ({s.mgPerMl} mg/mL)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VALIDATION ERROR */}
      {validationError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 animate-bounce" />
          <span>{validationError}</span>
        </div>
      )}

      {/* CALCULATE BUTTON */}
      <button
        type="button"
        onClick={onCalculate}
        disabled={isWithdrawn}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-black py-4 px-6 rounded-2xl transition shadow-lg shadow-blue-500/20 text-sm tracking-wide flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        {t('calculate_dose')}
      </button>

      {/* ================= RESTORED ORIGINAL CALCULATION RESULTS PANELS ================= */}
      {showResult && activeProtocol && evaluatedDose !== null && (
        <div className="space-y-5">
          
          {/* RECOMMENDED DOSE DETAILS CARD */}
          <div className="bg-emerald-500 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 rounded-3xl p-6 relative overflow-hidden">
            <span className="text-[9px] font-black tracking-widest uppercase bg-white/20 py-1 px-3 rounded-md mb-2 inline-block">
              {t('recommended_dose')}
            </span>
            
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-black">
                {Number.isInteger(evaluatedDose) ? evaluatedDose : evaluatedDose.toFixed(2)}
              </span>
              <span className="text-xl font-bold opacity-90">{activeProtocol.calculation.unit}</span>
              <span className="text-xl font-bold ml-2 opacity-95">{activeProtocol.route}</span>
            </div>

            {/* Weight-based dose info line */}
            {activeProtocol.doseType === 'weight_based' && matchedRule && (
              <p className="text-xs font-bold text-white/90 mt-2">
                ({matchedRule.explanationTemplate || `${activeProtocol.calculation.unit}/kg`})
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/20">
              <div>
                <p className="text-[9px] font-bold text-white/75 uppercase tracking-wider">{t('frequency')}</p>
                <p className="text-xs font-bold mt-0.5">{getLabel(activeProtocol.frequency)}</p>
              </div>
              {activeProtocol.maxSingleDoseMg && (
                <div>
                  <p className="text-[9px] font-bold text-white/75 uppercase tracking-wider">{t('max_single_dose')}</p>
                  <p className="text-xs font-bold mt-0.5">{activeProtocol.maxSingleDoseMg} mg</p>
                </div>
              )}
              {activeProtocol.maxDailyDoseMg && (
                <div>
                  <p className="text-[9px] font-bold text-white/75 uppercase tracking-wider">{t('max_daily_dose')}</p>
                  <p className="text-xs font-bold mt-0.5">{activeProtocol.maxDailyDoseMg} mg</p>
                </div>
              )}
            </div>
          </div>

          {/* VOLUME TO ADMINISTER CARD */}
          {evaluatedVolume !== null && selectedStrength && (
            <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('volume_admin')}</h3>
              
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-50">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    {t('concentration')}
                  </label>
                  <select
                    value={selectedStrengthId}
                    onChange={(e) => setSelectedStrengthId(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {med.availableStrengths.map(st => (
                      <option key={st.id} value={st.id}>
                        {getLabel(st.label)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    {t('dose')}
                  </label>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
                    {Number.isInteger(evaluatedDose) ? evaluatedDose : evaluatedDose.toFixed(2)} mg
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">{t('volume')}:</span>
                <span className="text-2xl font-black text-blue-600">
                  {Number.isInteger(evaluatedVolume) ? evaluatedVolume : evaluatedVolume.toFixed(3)} mL
                </span>
              </div>
            </div>
          )}

          {/* CALCULATION FORMULA & STEPS DISPLAY CARD */}
          {formulaSteps.length > 0 && (
            <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('formula')}</h3>
              <div className="bg-slate-50 border border-gray-200/60 rounded-2xl p-4 space-y-2 font-mono text-xs text-slate-700">
                {formulaSteps.map((step, idx) => (
                  <div key={idx} className={`${idx === formulaSteps.length - 1 ? 'border-t border-gray-200 pt-2 font-bold text-blue-600 text-sm mt-2' : ''}`}>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WARNINGS PANEL */}
          {activeProtocol.warnings && activeProtocol.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200/60 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {t('warnings')}
              </h3>
              <ul className="list-disc pl-5 text-xs font-medium text-amber-900/80 space-y-2 leading-relaxed">
                {activeProtocol.warnings.map((warn, i) => (
                  <li key={i}>{getLabel(warn.text)}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
