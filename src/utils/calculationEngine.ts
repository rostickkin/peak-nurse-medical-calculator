import { 
  Shield, 
  Activity, 
  Flame, 
  Heart, 
  Droplet, 
  Sparkles, 
  Wind, 
  Layers, 
  Grid
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Medication, Protocol, Rule } from '../types/medication';

export interface CategoryMetaItem {
  icon: LucideIcon;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
}

export const CATEGORY_META: Record<string, CategoryMetaItem> = {
  'Antibiotics': { icon: Shield, bgColor: 'bg-emerald-50/50', borderColor: 'border-emerald-100', textColor: 'text-emerald-800', badgeBg: 'bg-emerald-100/70 text-emerald-800' },
  'Analgesics': { icon: Activity, bgColor: 'bg-blue-50/50', borderColor: 'border-blue-100', textColor: 'text-blue-800', badgeBg: 'bg-blue-100/70 text-blue-800' },
  'NSAIDs': { icon: Flame, bgColor: 'bg-orange-50/50', borderColor: 'border-orange-100', textColor: 'text-orange-800', badgeBg: 'bg-orange-100/70 text-orange-800' },
  'Antiemetics': { icon: Heart, bgColor: 'bg-purple-50/50', borderColor: 'border-purple-100', textColor: 'text-purple-800', badgeBg: 'bg-purple-100/70 text-purple-800' },
  'H2 Blockers & PPIs': { icon: Droplet, bgColor: 'bg-cyan-50/50', borderColor: 'border-cyan-100', textColor: 'text-cyan-800', badgeBg: 'bg-cyan-100/70 text-cyan-800' },
  'Steroids': { icon: Sparkles, bgColor: 'bg-amber-50/50', borderColor: 'border-amber-100', textColor: 'text-amber-800', badgeBg: 'bg-amber-100/70 text-amber-800' },
  'Antihistamines': { icon: Wind, bgColor: 'bg-pink-50/50', borderColor: 'border-pink-100', textColor: 'text-pink-800', badgeBg: 'bg-pink-100/70 text-pink-800' },
  'Aminoglycosides': { icon: Layers, bgColor: 'bg-indigo-50/50', borderColor: 'border-indigo-100', textColor: 'text-indigo-800', badgeBg: 'bg-indigo-100/70 text-indigo-800' },
  'Others': { icon: Grid, bgColor: 'bg-slate-50', borderColor: 'border-slate-200/60', textColor: 'text-slate-800', badgeBg: 'bg-slate-100 text-slate-800' },
};

export const getCategoryGroup = (categoryStr: string): string => {
  const c = categoryStr.toLowerCase();
  if (c.includes('aminoglycoside')) return 'Aminoglycosides';
  if (c.includes('antibiotic') || c.includes('cephalosporin') || c.includes('penicillin') || c.includes('nitroimidazole') || c.includes('lincosamide') || c.includes('fluoroquinolone') || c.includes('carbapenem')) return 'Antibiotics';
  if (c.includes('antiemetic')) return 'Antiemetics';
  if (c.includes('nsaid')) return 'NSAIDs';
  if (c.includes('analgesic') || c.includes('opioid')) return 'Analgesics';
  if (c.includes('h2 blocker') || c.includes('proton pump inhibitor')) return 'H2 Blockers & PPIs';
  if (c.includes('corticosteroid') || c.includes('steroid')) return 'Steroids';
  if (c.includes('antihistamine')) return 'Antihistamines';
  return 'Others';
};

export const isMedicationWithdrawn = (med: Medication): boolean => {
  if (med.isWithdrawn) return true;
  if (med.verificationMeta?.clinicalStatus === 'REJECTED') return true;
  if (med.category?.toLowerCase().includes('withdrawn')) return true;
  return false;
};

export const getValidationErrorString = (
  type: 'weight' | 'crcl' | 'min_weight' | 'max_weight' | 'min_crcl' | 'max_crcl', 
  lang: string, 
  minMaxVal?: number
): string => {
  if (lang === 'ru') {
    if (type === 'weight') return 'Пожалуйста, введите корректный вес пациента.';
    if (type === 'crcl') return 'Пожалуйста, введите корректный клиренс креатинина (КК).';
    if (type === 'min_weight') return `Вес должен быть не менее ${minMaxVal} кг для данного протокола.`;
    if (type === 'max_weight') return `Вес не должен превышать ${minMaxVal} кг для данного протокола.`;
    if (type === 'min_crcl') return `КК должен быть не менее ${minMaxVal} мл/мин для данного протокола.`;
    if (type === 'max_crcl') return `КК не должен превышать ${minMaxVal} мл/мин для данного протокола.`;
  }
  if (lang === 'th') {
    if (type === 'weight') return 'กรุณากรอกน้ำหนักที่ถูกต้อง';
    if (type === 'crcl') return 'กรุณากรอกค่าการทำงานของไต (CrCl) ที่ถูกต้อง';
    if (type === 'min_weight') return `น้ำหนักต้องไม่น้อยกว่า ${minMaxVal} กก. สำหรับสูตรยานี้`;
    if (type === 'max_weight') return `น้ำหนักต้องไม่เกิน ${minMaxVal} กก. สำหรับสูตรยานี้`;
    if (type === 'min_crcl') return `ค่า CrCl ต้องไม่น้อยกว่า ${minMaxVal} มล./นาที`;
    if (type === 'max_crcl') return `ค่า CrCl ต้องไม่เกิน ${minMaxVal} มล./นาที`;
  }
  // Default to English
  if (type === 'weight') return 'Please enter a valid weight.';
  if (type === 'crcl') return 'Please enter a valid Creatinine Clearance.';
  if (type === 'min_weight') return `Weight must be at least ${minMaxVal} kg for this protocol.`;
  if (type === 'max_weight') return `Weight cannot exceed ${minMaxVal} kg for this protocol.`;
  if (type === 'min_crcl') return `CrCl must be at least ${minMaxVal} mL/min for this protocol.`;
  if (type === 'max_crcl') return `CrCl cannot exceed ${minMaxVal} mL/min for this protocol.`;
  
  return 'Please check your inputs.';
};

export const getAgeInYears = (ageStr: string, ageUnit: 'years' | 'months' | 'days'): number => {
  const val = parseFloat(ageStr) || 0;
  if (ageUnit === 'months') return val / 12;
  if (ageUnit === 'days') return val / 365;
  return val;
};

export const getActiveProtocol = (
  med: Medication | undefined,
  indicationId: string,
  selectedRoute: string,
  ageInYears: number
): Protocol | null => {
  if (!med || !indicationId) return null;
  const indication = med.indications.find(i => i.id === indicationId);
  if (!indication) return null;

  // 1. Exact match (selected route and age within specified range)
  let match = indication.protocols.find(p => {
    const min = p.ageRange?.min ?? 0;
    const max = p.ageRange?.max ?? Infinity;
    return p.route === selectedRoute && ageInYears >= min && ageInYears <= max;
  });
  if (match) return match;

  // 2. Population name + route match
  let pop: "adult" | "pediatric" | "neonatal" = 'adult';
  if (ageInYears < 0.08) pop = 'neonatal';
  else if (ageInYears < 12) pop = 'pediatric';

  match = indication.protocols.find(p => p.route === selectedRoute && p.population === pop);
  if (match) return match;

  // 3. Just Route match fallback
  match = indication.protocols.find(p => p.route === selectedRoute);
  if (match) return match;

  // 4. Default to first protocol
  return indication.protocols[0] || null;
};

export interface CalculationResult {
  matchedRule: Rule | null;
  evaluatedDose: number | null;
  formulaSteps: string[];
}

export const calculateDoseResult = (
  protocol: Protocol | null,
  weightNum: number,
  crclNum: number,
  ageYears: number
): CalculationResult => {
  let matchedRule: Rule | null = null;
  let evaluatedDose: number | null = null;
  const formulaSteps: string[] = [];

  if (!protocol) {
    return { matchedRule: null, evaluatedDose: null, formulaSteps: [] };
  }

  const rules = protocol.calculation.rules;
  for (const rule of rules) {
    try {
      const condFn = new Function('weight', 'crcl', 'age', `return ${rule.condition};`);
      if (condFn(weightNum, crclNum, ageYears)) {
        matchedRule = rule;
        break;
      }
    } catch (err) {
      console.error("Condition eval error:", err);
    }
  }

  if (matchedRule) {
    try {
      const formulaFn = new Function('weight', 'crcl', 'age', `return ${matchedRule.formula};`);
      let rawDose = formulaFn(weightNum, crclNum, ageYears);

      // Enforce maxSingleDoseMg if set and formula didn't cap it
      if (protocol.maxSingleDoseMg !== null && rawDose > protocol.maxSingleDoseMg) {
        rawDose = protocol.maxSingleDoseMg;
      }

      evaluatedDose = rawDose;

      const rawFormula = matchedRule.formula;
      
      const formatMath = (str: string) => {
        return str
          .replace(/Math\.min/g, 'Min')
          .replace(/Math\.max/g, 'Max')
          .replace(/Math\.round/g, 'Round')
          .replace(/Math\.floor/g, 'Floor')
          .replace(/Math\.ceil/g, 'Ceil')
          .replace(/\*/g, ' × ')
          .replace(/\//g, ' ÷ ');
      };

      formulaSteps.push(`Dose = ${formatMath(rawFormula)}`);

      let sub = rawFormula
        .replace(/\bweight\b/g, weightNum.toString())
        .replace(/\bcrcl\b/g, crclNum.toString())
        .replace(/\bage\b/g, ageYears.toFixed(2));
      formulaSteps.push(`= ${formatMath(sub)}`);

      if (rawFormula.includes('weight') && (rawFormula.includes('Math.min') || rawFormula.includes('Math.round'))) {
        if (rawFormula.includes('weight * 0.1')) {
          formulaSteps.push(`= Min(${(weightNum * 0.1).toFixed(2)}, 4)`);
        } else if (rawFormula.includes('weight * 1.25')) {
          formulaSteps.push(`= Min(${(weightNum * 1.25).toFixed(2)}, 50)`);
        } else if (rawFormula.includes('weight*15')) {
          formulaSteps.push(`= Round(${(weightNum * 15).toFixed(2)})`);
        }
      }

      if (evaluatedDose !== null) {
        const finalVal = Number.isInteger(evaluatedDose) ? evaluatedDose : Number(evaluatedDose.toFixed(2));
        const roundedSuffix = rawFormula.includes('Math.round') || rawFormula.includes('Math.floor') || rawFormula.includes('Math.ceil') ? ' (Rounded)' : '';
        formulaSteps.push(`= ${finalVal} ${protocol.calculation.unit}${roundedSuffix}`);
      }
    } catch (err) {
      console.error("Formula eval error:", err);
    }
  }

  return { matchedRule, evaluatedDose, formulaSteps };
};

export const filterMedicationsByPrefixSearch = (
  medications: Medication[],
  query: string,
  categoryFilter: string = 'All'
): Medication[] => {
  const q = query.trim().toLowerCase();
  
  if (!q) {
    return medications.filter(med => 
      categoryFilter === 'All' || getCategoryGroup(med.category) === categoryFilter
    ).sort((a, b) => a.genericName.localeCompare(b.genericName));
  }

  // 1. Strict prefix matches (genericName, brandNames, activeIngredient start with query)
  const prefixMatches = medications.filter(med => {
    if (categoryFilter !== 'All' && getCategoryGroup(med.category) !== categoryFilter) {
      return false;
    }
    const genericLower = med.genericName.toLowerCase();
    if (genericLower.startsWith(q)) return true;
    if (med.brandNames?.some(b => b.toLowerCase().startsWith(q))) return true;
    if (med.activeIngredient?.toLowerCase().startsWith(q)) return true;
    return false;
  });

  if (prefixMatches.length > 0) {
    return prefixMatches.sort((a, b) => a.genericName.localeCompare(b.genericName));
  }

  // 2. Fallback substring matches if no prefix match
  return medications.filter(med => {
    if (categoryFilter !== 'All' && getCategoryGroup(med.category) !== categoryFilter) {
      return false;
    }
    const genericLower = med.genericName.toLowerCase();
    if (genericLower.includes(q)) return true;
    if (med.brandNames?.some(b => b.toLowerCase().includes(q))) return true;
    if (med.activeIngredient?.toLowerCase().includes(q)) return true;
    return false;
  }).sort((a, b) => a.genericName.localeCompare(b.genericName));
};
