import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertTriangle, 
  Search, 
  ChevronLeft, 
  Globe, 
  Star, 
  Shield, 
  Activity, 
  Flame, 
  Heart, 
  Droplet, 
  Sparkles, 
  Wind, 
  Layers, 
  Grid,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check
} from 'lucide-react';
import database from './data/database.json';

// --- TS INTERFACES FOR DATABASE SCHEMA ---
interface Label {
  th: string;
  en: string;
  ru: string;
  [key: string]: string;
}

interface AvailableStrength {
  id: string;
  label: Label;
  mgPerMl: number;
}

interface RequiredInput {
  id: string;
  label: Label;
  type: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}

interface Rule {
  condition: string;
  formula: string;
  explanationTemplate?: string;
}

interface Calculation {
  unit: string;
  rules: Rule[];
}

interface Frequency {
  th: string;
  en: string;
  ru: string;
  [key: string]: string;
}

interface Administration {
  th: string;
  en: string;
  ru: string;
  [key: string]: string;
}

interface RenalAdjustment {
  required: boolean;
  note: Label;
}

interface HepaticAdjustment {
  required: boolean;
  note: Label;
}

interface Warning {
  type: string;
  text: Label;
}

interface Source {
  title: string;
  organization: string;
}

interface Protocol {
  id: string;
  population: "adult" | "pediatric" | "neonatal";
  populationLabel: Label;
  route: string;
  routeLabel: Label;
  ageRange?: {
    min?: number;
    max?: number;
  };
  requiredInputs: RequiredInput[];
  doseType: "fixed" | "weight_based" | "renal_adjusted";
  calculation: Calculation;
  maxSingleDoseMg: number | null;
  maxDailyDoseMg: number | null;
  frequency: Frequency;
  administration: Administration;
  renalAdjustment: RenalAdjustment;
  hepaticAdjustment: HepaticAdjustment;
  warnings?: Warning[];
  sources: Source[];
  verificationStatus: string;
  notes?: Label;
}

interface Indication {
  id: string;
  name: Label;
  protocols: Protocol[];
}

interface VerificationMeta {
  clinicalStatus: string;
  thailandStatus: string;
  productionReady: boolean;
  verificationDate: string;
  verificationScope: string;
  notes: string;
}

interface Medication {
  id: string;
  genericName: string;
  brandNames: string[];
  activeIngredient: string;
  category: string;
  isStrict: boolean;
  availableStrengths: AvailableStrength[];
  indications: Indication[];
  verificationMeta?: VerificationMeta;
}

// --- CATEGORY METADATA MAP FOR DESIGN SYSTEM ---
interface CategoryStyle {
  icon: typeof Shield;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
}

const CATEGORY_META: Record<string, CategoryStyle> = {
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

// Map raw database category strings to visual display category groups
const getCategoryGroup = (categoryStr: string): string => {
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

// Inline helper to get validation warning messages
const getValidationErrorString = (type: 'weight' | 'crcl' | 'min_weight' | 'max_weight' | 'min_crcl' | 'max_crcl', lang: string, minMaxVal?: number): string => {
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

// --- CUSTOM LANGUAGE DROPDOWN COMPONENT ---
const LanguageDropdown = ({ align = 'right' }: { align?: 'right' | 'center' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const langs = [
    { code: 'th', label: 'TH', flag: 'https://flagcdn.com/w20/th.png' },
    { code: 'en', label: 'EN', flag: 'https://flagcdn.com/w20/gb.png' },
    { code: 'ru', label: 'RU', flag: 'https://flagcdn.com/w20/ru.png' },
  ];
  
  const current = langs.find(l => l.code === i18n.language) || langs[0];

  return (
    <div className="relative" ref={ref}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg transition"
      >
        <img src={current.flag} alt={current.label} className="w-4 h-auto rounded-sm shadow-sm" />
        <span className="font-bold text-xs tracking-wide">{current.label}</span>
      </button>
      
      {isOpen && (
        <div className={`absolute mt-1.5 w-28 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 ${align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0'}`}>
          {langs.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => { i18n.changeLanguage(lang.code); setIsOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition text-left"
            >
              <img src={lang.flag} alt={lang.label} className="w-4 h-auto rounded-sm shadow-sm" />
              <span className="font-bold">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  
  // App Core States
  const [agreed, setAgreed] = useState<boolean>(() => {
    return localStorage.getItem('peak_nurse_agreed') === 'true';
  });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [homeTab, setHomeTab] = useState<'recent' | 'favorites'>('recent');
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  
  // Calculator Tab states
  const [activeTab, setActiveTab] = useState<'calculator' | 'information' | 'references'>('calculator');
  const [selectedIndicationId, setSelectedIndicationId] = useState<string>('');
  const [age, setAge] = useState<string>('32');
  const [ageUnit, setAgeUnit] = useState<'years' | 'months' | 'days'>('years');
  const [weight, setWeight] = useState<string>('57');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [crcl, setCrcl] = useState<string>('45');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedStrengthId, setSelectedStrengthId] = useState<string>('');

  // Calculation Results
  const [showResult, setShowResult] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // References Tab: Collapsible Source states
  const [sourcesOpen, setSourcesOpen] = useState(true);

  // Local Storage lists
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const favs = localStorage.getItem('peak_nurse_favorites');
      return favs ? JSON.parse(favs) : [];
    } catch {
      return [];
    }
  });

  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const rec = localStorage.getItem('peak_nurse_recent');
      return rec ? JSON.parse(rec) : [];
    } catch {
      return [];
    }
  });

  // Persist Agreement
  const handleAgree = () => {
    localStorage.setItem('peak_nurse_agreed', 'true');
    setAgreed(true);
  };

  const currentMed = (database as Medication[]).find(m => m.id === selectedMedId);



  // Persistence helpers
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem('peak_nurse_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const selectMedication = (id: string) => {
    setSelectedMedId(id);
    setActiveTab('calculator');

    const med = (database as Medication[]).find(m => m.id === id);
    if (med) {
      const firstIndication = med.indications?.[0];
      const indId = firstIndication?.id || '';
      setSelectedIndicationId(indId);

      const firstProtocol = firstIndication?.protocols?.[0];
      setSelectedRoute(firstProtocol?.route || '');

      const firstStrength = med.availableStrengths?.[0];
      setSelectedStrengthId(firstStrength?.id || '');

      if (firstProtocol) {
        const weightInput = firstProtocol.requiredInputs?.find(i => i.id === 'weight');
        if (weightInput) {
          setWeight(weightInput.defaultValue?.toString() || '70');
        } else {
          setWeight('70');
        }

        const crclInput = firstProtocol.requiredInputs?.find(i => i.id === 'crcl');
        if (crclInput) {
          setCrcl(crclInput.defaultValue?.toString() || '90');
        } else {
          setCrcl('90');
        }

        if (firstProtocol.population === 'pediatric') {
          setAge('5');
          setAgeUnit('years');
        } else if (firstProtocol.population === 'neonatal') {
          setAge('10');
          setAgeUnit('days');
        } else {
          setAge('32');
          setAgeUnit('years');
        }
      }
    }

    setShowResult(false);
    setValidationError(null);

    setRecent(prev => {
      const filtered = prev.filter(item => item !== id);
      const updated = [id, ...filtered].slice(0, 10);
      localStorage.setItem('peak_nurse_recent', JSON.stringify(updated));
      return updated;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIndicationChange = (indId: string) => {
    setSelectedIndicationId(indId);
    if (currentMed) {
      const indication = currentMed.indications.find(i => i.id === indId);
      if (indication) {
        const firstProtocol = indication.protocols?.[0];
        setSelectedRoute(firstProtocol?.route || '');
        setShowResult(false);
        setValidationError(null);
      }
    }
  };

  const goHome = () => {
    setSelectedMedId(null);
    setShowResult(false);
    setValidationError(null);
  };

  // Convert Age Unit to Years for clinical math matching
  const getAgeInYears = (): number => {
    const val = parseFloat(age) || 0;
    if (ageUnit === 'months') return val / 12;
    if (ageUnit === 'days') return val / 365;
    return val;
  };

  // Safe Protocol matching using database parameters
  const getActiveProtocol = (): Protocol | null => {
    if (!currentMed || !selectedIndicationId) return null;
    const indication = currentMed.indications.find(i => i.id === selectedIndicationId);
    if (!indication) return null;

    const ageYears = getAgeInYears();

    // 1. Exact match (selected route and age within specified range)
    let match = indication.protocols.find(p => {
      const min = p.ageRange?.min ?? 0;
      const max = p.ageRange?.max ?? Infinity;
      return p.route === selectedRoute && ageYears >= min && ageYears <= max;
    });
    if (match) return match;

    // 2. Population name + route match
    let pop: "adult" | "pediatric" | "neonatal" = 'adult';
    if (ageYears < 0.08) pop = 'neonatal';
    else if (ageYears < 12) pop = 'pediatric';

    match = indication.protocols.find(p => p.route === selectedRoute && p.population === pop);
    if (match) return match;

    // 3. Just Route match fallback
    match = indication.protocols.find(p => p.route === selectedRoute);
    if (match) return match;

    // 4. Default to first protocol
    return indication.protocols[0] || null;
  };

  const activeProtocol = getActiveProtocol();

  // Validate inputs before triggering result calculation
  const handleCalculate = () => {
    setValidationError(null);
    if (!activeProtocol) return;

    const weightNum = parseFloat(weight);
    const crclNum = parseFloat(crcl);

    const hasWeight = activeProtocol.requiredInputs.some(i => i.id === 'weight');
    if (hasWeight) {
      if (isNaN(weightNum) || weightNum <= 0) {
        setValidationError(getValidationErrorString('weight', currentLang));
        return;
      }
      const weightDef = activeProtocol.requiredInputs.find(i => i.id === 'weight');
      if (weightDef) {
        if (weightDef.min && weightNum < weightDef.min) {
          setValidationError(getValidationErrorString('min_weight', currentLang, weightDef.min));
          return;
        }
        if (weightDef.max && weightNum > weightDef.max) {
          setValidationError(getValidationErrorString('max_weight', currentLang, weightDef.max));
          return;
        }
      }
    }

    const hasCrcl = activeProtocol.requiredInputs.some(i => i.id === 'crcl');
    if (hasCrcl) {
      if (isNaN(crclNum) || crclNum <= 0) {
        setValidationError(getValidationErrorString('crcl', currentLang));
        return;
      }
      const crclDef = activeProtocol.requiredInputs.find(i => i.id === 'crcl');
      if (crclDef) {
        if (crclDef.min && crclNum < crclDef.min) {
          setValidationError(getValidationErrorString('min_crcl', currentLang, crclDef.min));
          return;
        }
        if (crclDef.max && crclNum > crclDef.max) {
          setValidationError(getValidationErrorString('max_crcl', currentLang, crclDef.max));
          return;
        }
      }
    }

    setShowResult(true);
  };

  // --- CALCULATION FORMULA GENERATION ENGINE ---
  let matchedRule: Rule | null = null;
  let evaluatedDose: number | null = null;
  let formulaSteps: string[] = [];

  const weightNum = parseFloat(weight) || 0;
  const crclNum = parseFloat(crcl) || 0;
  const ageYears = getAgeInYears();

  if (activeProtocol && showResult) {
    const rules = activeProtocol.calculation.rules;
    for (const rule of rules) {
      try {
        const condFn = new Function('weight', 'crcl', 'age', `return ${rule.condition};`);
        const isMatched = condFn(weightNum, crclNum, ageYears);
        if (isMatched) {
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
        evaluatedDose = formulaFn(weightNum, crclNum, ageYears);

        const rawFormula = matchedRule.formula;
        
        // Clean formulas for beautiful display on-screen
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

        // Replace keywords with actual user values
        let sub = rawFormula
          .replace(/\bweight\b/g, weightNum.toString())
          .replace(/\bcrcl\b/g, crclNum.toString())
          .replace(/\bage\b/g, ageYears.toFixed(2));
        formulaSteps.push(`= ${formatMath(sub)}`);

        // Handle nested operations for step-by-step intermediate view
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
          formulaSteps.push(`= ${finalVal} ${activeProtocol.calculation.unit}${roundedSuffix}`);
        }
      } catch (err) {
        console.error("Formula eval error:", err);
      }
    }
  }

  // --- VOLUME TO ADMINISTER ENGINE ---
  const selectedStrength = currentMed?.availableStrengths.find(s => s.id === selectedStrengthId);
  let evaluatedVolume: number | null = null;
  if (evaluatedDose !== null && selectedStrength && selectedStrength.mgPerMl > 0) {
    evaluatedVolume = evaluatedDose / selectedStrength.mgPerMl;
  }

  // --- FILTERING & RE-SORTING DRUGS ---
  const filteredMeds = (database as Medication[]).filter(med => {
    // Search filter
    const matchesSearch = 
      med.genericName.toLowerCase().includes(search.toLowerCase()) ||
      med.brandNames.some(b => b.toLowerCase().includes(search.toLowerCase())) ||
      med.activeIngredient.toLowerCase().includes(search.toLowerCase());

    // Category filter
    if (selectedCategory === 'All') return matchesSearch;
    return matchesSearch && getCategoryGroup(med.category) === selectedCategory;
  });

  // Group filtered meds alphabetically
  const alphabeticalGroups: Record<string, Medication[]> = {};
  filteredMeds
    .sort((a, b) => a.genericName.localeCompare(b.genericName))
    .forEach(med => {
      const letter = med.genericName[0].toUpperCase();
      if (!alphabeticalGroups[letter]) alphabeticalGroups[letter] = [];
      alphabeticalGroups[letter].push(med);
    });

  // Category counts
  const categoryCounts: Record<string, number> = {};
  Object.keys(CATEGORY_META).forEach(cat => {
    categoryCounts[cat] = (database as Medication[]).filter(m => getCategoryGroup(m.category) === cat).length;
  });

  // --- DISCLAIMER MODAL SCREEN ---
  if (!agreed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100 transition-all duration-300 transform scale-100">
          <div className="relative w-36 h-36 mx-auto mb-4 bg-blue-50/50 rounded-full flex items-center justify-center">
            <img src={`${import.meta.env.BASE_URL}nurse.png`} alt="Nurse" className="w-28 h-28 object-contain" />
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">PEAK NURSE</h1>
          <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-6">{t('disclaimer_title')}</p>
          
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 text-left">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-rose-900/80 text-xs font-medium leading-relaxed">{t('disclaimer_text')}</p>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-8 bg-gray-50 border border-gray-200/50 py-2 px-4 rounded-xl max-w-xs mx-auto">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-500 mr-1">{t('language')}:</span>
            <LanguageDropdown align="center" />
          </div>

          <button 
            type="button"
            onClick={handleAgree}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-6 rounded-2xl transition shadow-lg shadow-blue-500/20 text-sm tracking-wide"
          >
            {t('i_agree')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans antialiased">
      {/* HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-xl mx-auto w-full px-5 py-3.5 flex items-center justify-between">
          <button type="button" onClick={goHome} className="flex items-center gap-3 active:scale-95 transition">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-9 h-9 object-contain" />
            <div className="text-left leading-tight">
              <h1 className="text-sm font-black text-blue-600 tracking-wide uppercase">PEAK NURSE</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Medical Calculator</p>
            </div>
          </button>
          
          <LanguageDropdown align="right" />
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4 pb-20">
        
        {/* ================= SCREEN 1: HOME SCREEN ================= */}
        {!selectedMedId && (
          <div className="space-y-6">
            
            {/* SEARCH BANNER */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl pl-12 pr-10 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
              />
              {search && (
                <button 
                  type="button" 
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black bg-gray-100 hover:bg-gray-200 text-gray-500 px-2 py-1 rounded-md transition"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* CATEGORIES GRID */}
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

            {/* RECENT | FAVORITES TABS */}
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

              {/* LIST CONTROLLER */}
              {homeTab === 'recent' ? (
                recent.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs font-bold text-gray-400 mb-1">{t('no_recent')}</p>
                    <p className="text-[10px] text-gray-300">Medications you calculate will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recent.map(id => {
                      const med = (database as Medication[]).find(m => m.id === id);
                      if (!med) return null;
                      const style = CATEGORY_META[getCategoryGroup(med.category)] || CATEGORY_META['Others'];
                      const IconComponent = style.icon;
                      // Unique routes label
                      const uniqRoutes = [...new Set(med.indications?.flatMap(ind => ind.protocols?.map(p => p.route)))];
                      
                      return (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => selectMedication(med.id)}
                          className="flex items-center gap-3.5 py-3 w-full text-left hover:bg-gray-50/50 px-2 rounded-xl transition active:scale-98"
                        >
                          <span className={`p-2 rounded-xl ${style.badgeBg}`}>
                            <IconComponent className="w-4 h-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 text-xs truncate">{med.genericName}</h4>
                            <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                              {med.brandNames?.[0] ? `${med.brandNames[0]} · ` : ''}{getCategoryGroup(med.category)} · {uniqRoutes.join(' / ')}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                favorites.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs font-bold text-gray-400 mb-1">{t('no_favorites')}</p>
                    <p className="text-[10px] text-gray-300">Tap the ⭐ on drug detail screens to add.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {favorites.map(id => {
                      const med = (database as Medication[]).find(m => m.id === id);
                      if (!med) return null;
                      const style = CATEGORY_META[getCategoryGroup(med.category)] || CATEGORY_META['Others'];
                      const IconComponent = style.icon;
                      const uniqRoutes = [...new Set(med.indications?.flatMap(ind => ind.protocols?.map(p => p.route)))];
                      
                      return (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => selectMedication(med.id)}
                          className="flex items-center gap-3.5 py-3 w-full text-left hover:bg-gray-50/50 px-2 rounded-xl transition active:scale-98"
                        >
                          <span className={`p-2 rounded-xl ${style.badgeBg}`}>
                            <IconComponent className="w-4 h-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 text-xs truncate">{med.genericName}</h4>
                            <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                              {med.brandNames?.[0] ? `${med.brandNames[0]} · ` : ''}{getCategoryGroup(med.category)} · {uniqRoutes.join(' / ')}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* ALL MEDICATIONS ALPHABETICAL INDEX */}
            <div>
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3 px-1">{t('all_medications')}</h2>
              
              {filteredMeds.length === 0 ? (
                <div className="bg-white border border-gray-200/60 rounded-3xl p-8 text-center shadow-sm">
                  <p className="text-xs font-bold text-gray-400 mb-1">{t('no_results')}</p>
                  <p className="text-[10px] text-gray-300">Try checking spelling or resetting your filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(alphabeticalGroups).map(([letter, meds]) => (
                    <div key={letter} className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm">
                      <div className="text-xs font-black text-blue-600 mb-2 pb-1 border-b border-gray-50 tracking-wider">
                        {letter}
                      </div>
                      <div className="divide-y divide-gray-50">
                        {meds.map(med => {
                          const style = CATEGORY_META[getCategoryGroup(med.category)] || CATEGORY_META['Others'];
                          const IconComponent = style.icon;
                          const uniqRoutes = [...new Set(med.indications?.flatMap(ind => ind.protocols?.map(p => p.route)))];

                          return (
                            <button
                              key={med.id}
                              type="button"
                              onClick={() => selectMedication(med.id)}
                              className="flex items-center gap-3.5 py-3 w-full text-left hover:bg-gray-50/50 px-1 rounded-xl transition active:scale-[0.99]"
                            >
                              <span className={`p-2 rounded-xl ${style.badgeBg} flex-shrink-0`}>
                                <IconComponent className="w-4 h-4" />
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-xs truncate">{med.genericName}</h4>
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

          </div>
        )}

        {/* ================= SCREEN 2: MEDICATION CALCULATOR SCREEN ================= */}
        {selectedMedId && currentMed && (
          <div className="space-y-5">
            
            {/* BACK BAR & MED HEADER */}
            <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={goHome}
                  className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-blue-600 bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-xl transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('back')}
                </button>

                <button
                  type="button"
                  onClick={() => toggleFavorite(currentMed.id)}
                  className={`p-2 rounded-xl transition-all border ${
                    favorites.includes(currentMed.id)
                      ? 'bg-amber-50 border-amber-200 text-amber-500'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                  {(() => {
                    const style = CATEGORY_META[getCategoryGroup(currentMed.category)] || CATEGORY_META['Others'];
                    const IconComponent = style.icon;
                    return <IconComponent className="w-6 h-6 text-blue-600" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-gray-800 tracking-tight leading-snug">{currentMed.genericName}</h2>
                  {currentMed.brandNames && currentMed.brandNames.length > 0 && (
                    <p className="text-xs font-bold text-gray-400 mt-0.5">{currentMed.brandNames.join(', ')}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100/70 text-blue-800 py-0.5 px-2 rounded-md">
                      {getCategoryGroup(currentMed.category)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 py-0.5 px-2 rounded-md">
                      {[...new Set(currentMed.indications?.flatMap(ind => ind.protocols?.map(p => p.route)))].join(' · ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* STRICT CONTROL WARNING BADGE */}
            {currentMed.isStrict && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-pulse">
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 animate-bounce" />
                <div>
                  <h4 className="text-xs font-black text-rose-900">{t('strict_med')}</h4>
                  <p className="text-[10px] font-bold text-rose-800/70 mt-0.5">Strict double-check required per hospital policy.</p>
                </div>
              </div>
            )}

            {/* SCREEN TAB SYSTEM */}
            <div className="flex bg-white border border-gray-200/60 rounded-2xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('calculator')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider text-center rounded-xl transition-all ${
                  activeTab === 'calculator'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('calculator')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('information')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider text-center rounded-xl transition-all ${
                  activeTab === 'information'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('information')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('references')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider text-center rounded-xl transition-all ${
                  activeTab === 'references'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('references')}
              </button>
            </div>

            {/* TAB CONTENT: CALCULATOR */}
            {activeTab === 'calculator' && (
              <div className="space-y-5">
                
                {/* 1. INDICATION SELECT */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">1. {t('indication')}</h3>
                  <div className="relative">
                    <select
                      value={selectedIndicationId}
                      onChange={(e) => handleIndicationChange(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-black text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      {currentMed.indications.map(ind => (
                        <option key={ind.id} value={ind.id}>
                          {ind.name[currentLang] || ind.name.en}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 2. PATIENT INFORMATION */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">2. {t('patient_info')}</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* AGE FIELD - ALWAYS PRESENT AS PRIMARY RESOLUTION TOOL */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                        {t('age')}
                      </label>
                      <div className="flex border border-gray-200 rounded-2xl bg-slate-50 overflow-hidden">
                        <input
                          type="number"
                          placeholder="0"
                          value={age}
                          onChange={(e) => { setAge(e.target.value); setShowResult(false); }}
                          className="w-full bg-transparent px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none"
                        />
                        <select
                          value={ageUnit}
                          onChange={(e) => { setAgeUnit(e.target.value as any); setShowResult(false); }}
                          className="bg-transparent border-l border-gray-200 text-[10px] font-black text-gray-500 focus:outline-none px-2 cursor-pointer"
                        >
                          <option value="years">{t('years')}</option>
                          <option value="months">{t('months')}</option>
                          <option value="days">{t('days')}</option>
                        </select>
                      </div>
                    </div>

                    {/* GENDER FIELD - TO MATCH MOCKUP PERFECTLY */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                        {t('gender')}
                      </label>
                      <div className="flex border border-gray-200 rounded-2xl p-0.5 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setGender('male')}
                          className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all ${
                            gender === 'male'
                              ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {t('male')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender('female')}
                          className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all ${
                            gender === 'female'
                              ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {t('female')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DYNAMICALLY LOADED INPUTS PER protocol.requiredInputs */}
                  {activeProtocol && (
                    <div className="space-y-4">
                      {activeProtocol.requiredInputs.map(inp => {
                        if (inp.id === 'weight') {
                          return (
                            <div key={inp.id}>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                                {inp.label[currentLang] || inp.label.en}
                              </label>
                              <div className="flex border border-gray-200 rounded-2xl bg-slate-50 overflow-hidden">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={weight}
                                  onChange={(e) => { setWeight(e.target.value); setShowResult(false); }}
                                  className="w-full bg-transparent px-3.5 py-3 text-sm font-bold text-gray-800 focus:outline-none"
                                />
                                <span className="bg-gray-100 border-l border-gray-200 text-xs font-black text-gray-500 flex items-center px-4">
                                  kg
                                </span>
                              </div>
                            </div>
                          );
                        }
                        
                        if (inp.id === 'crcl') {
                          return (
                            <div key={inp.id}>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                                {inp.label[currentLang] || inp.label.en}
                              </label>
                              <div className="flex border border-gray-200 rounded-2xl bg-slate-50 overflow-hidden">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={crcl}
                                  onChange={(e) => { setCrcl(e.target.value); setShowResult(false); }}
                                  className="w-full bg-transparent px-3.5 py-3 text-sm font-bold text-gray-800 focus:outline-none"
                                />
                                <span className="bg-gray-100 border-l border-gray-200 text-[10px] font-black text-gray-500 flex items-center px-3">
                                  mL/min
                                </span>
                              </div>
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                  )}
                </div>

                {/* 3. ROUTE OF ADMINISTRATION */}
                {(() => {
                  const indication = currentMed.indications.find(i => i.id === selectedIndicationId);
                  if (!indication) return null;
                  const availableRoutes = [...new Set(indication.protocols.map(p => p.route))];
                  
                  return (
                    <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-3">
                      <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">3. {t('route_admin')}</h3>
                      
                      {availableRoutes.length === 1 ? (
                        <div className="bg-slate-50 border border-gray-100 rounded-2xl p-3.5 text-xs font-bold text-gray-600 flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>{t('route_admin')}: <strong className="text-blue-600">{availableRoutes[0]}</strong></span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {availableRoutes.map(rt => (
                            <button
                              key={rt}
                              type="button"
                              onClick={() => { setSelectedRoute(rt); setShowResult(false); }}
                              className={`flex-1 py-3 text-xs font-black rounded-2xl transition border active:scale-98 ${
                                selectedRoute === rt
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm font-extrabold'
                                  : 'bg-slate-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                              }`}
                            >
                              {rt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* VALIDATION ERROR DISPLAY */}
                {validationError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-2 text-rose-700 text-xs font-bold shadow-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* CALCULATE BUTTON */}
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black py-4 px-6 rounded-2xl transition shadow-lg shadow-blue-500/20 text-sm tracking-wide"
                >
                  {t('calculate_dose')}
                </button>

                {/* ================= CALCULATION RESULTS PANELS ================= */}
                {showResult && activeProtocol && evaluatedDose !== null && (
                  <div className="space-y-5">
                    
                    {/* RECOMMENDED DOSE DETAILS */}
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
                          <p className="text-xs font-bold mt-0.5">{activeProtocol.frequency[currentLang] || activeProtocol.frequency.en}</p>
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

                    {/* VOLUME TO ADMINISTER */}
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
                              {currentMed.availableStrengths.map(st => (
                                <option key={st.id} value={st.id}>
                                  {st.label[currentLang] || st.label.en}
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

                    {/* CALCULATION FORMULA & STEPS DISPLAY */}
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
                            <li key={i}>{warn.text[currentLang] || warn.text.en}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ADMINISTRATION DETAILS */}
                    <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-3">
                      <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('administration')}</h3>
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-xs font-bold leading-relaxed text-blue-900/80">
                        {activeProtocol.administration[currentLang] || activeProtocol.administration.en}
                      </div>
                    </div>

                    {/* RENAL / HEPATIC ADJUSTMENT PANEL */}
                    <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-3">
                      <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Adjustment</h3>
                      <div className="space-y-2.5">
                        <div className="border border-gray-100 rounded-2xl p-3.5 flex flex-col gap-1 text-xs">
                          <span className="font-black text-gray-400 uppercase tracking-wider text-[9px]">{t('renal_adjustment')}</span>
                          <span className="font-bold text-slate-700 mt-1">
                            {activeProtocol.renalAdjustment.required ? (
                              <span className="text-rose-500">Required: </span>
                            ) : (
                              <span className="text-emerald-600">Not required: </span>
                            )}
                            {activeProtocol.renalAdjustment.note[currentLang] || activeProtocol.renalAdjustment.note.en}
                          </span>
                        </div>
                        
                        <div className="border border-gray-100 rounded-2xl p-3.5 flex flex-col gap-1 text-xs">
                          <span className="font-black text-gray-400 uppercase tracking-wider text-[9px]">{t('hepatic_adjustment')}</span>
                          <span className="font-bold text-slate-700 mt-1">
                            {activeProtocol.hepaticAdjustment.required ? (
                              <span className="text-rose-500">Required: </span>
                            ) : (
                              <span className="text-emerald-600">Not required: </span>
                            )}
                            {activeProtocol.hepaticAdjustment.note[currentLang] || activeProtocol.hepaticAdjustment.note.en}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: INFORMATION */}
            {activeTab === 'information' && (
              <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Active Ingredient</h3>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed bg-slate-50 rounded-2xl p-4 border border-gray-100">
                    {currentMed.activeIngredient}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Available strengths</h3>
                  <div className="space-y-2">
                    {currentMed.availableStrengths.map(st => (
                      <div key={st.id} className="bg-slate-50 border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>{st.label[currentLang] || st.label.en}</span>
                        {st.mgPerMl > 0 && <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] tracking-wide">{st.mgPerMl} mg/mL</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {activeProtocol && activeProtocol.notes && (
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Clinical Dosing Notes</h3>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed bg-blue-50/20 rounded-2xl p-4 border border-blue-100/40">
                      {activeProtocol.notes[currentLang] || activeProtocol.notes.en}
                    </p>
                  </div>
                )}
                
                {currentMed.verificationMeta?.notes && (
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Database Verification Scope</h3>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 rounded-2xl p-4 border border-gray-100">
                      {currentMed.verificationMeta.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: REFERENCES */}
            {activeTab === 'references' && (
              <div className="space-y-5">
                
                {/* STATUS BADGE */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Verification Status</h3>
                    {activeProtocol?.verificationStatus === 'verified' ? (
                      <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>✓ Verified Clinical Data</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-100 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>⚠ Partially Verified Data</span>
                      </div>
                    )}
                  </div>

                  {currentMed.verificationMeta && (
                    <div className="space-y-3 pt-3 border-t border-gray-50">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Scope Of Audit</span>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed mt-1">{currentMed.verificationMeta.verificationScope}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Clinical Status</span>
                          <span className="text-xs font-bold text-slate-700 mt-1 block">{currentMed.verificationMeta.clinicalStatus}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Thailand Relevance</span>
                          <span className="text-xs font-bold text-slate-700 mt-1 block">{currentMed.verificationMeta.thailandStatus}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CLINICAL SOURCES - COLLAPSIBLE AS REQUESTED */}
                {activeProtocol && activeProtocol.sources && (
                  <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-4">
                    <button
                      type="button"
                      onClick={() => setSourcesOpen(!sourcesOpen)}
                      className="flex items-center justify-between w-full"
                    >
                      <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">
                        Sources ({activeProtocol.sources.length})
                      </h3>
                      {sourcesOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {sourcesOpen && (
                      <div className="divide-y divide-gray-100 space-y-1.5">
                        {activeProtocol.sources.map((source, idx) => (
                          <div key={idx} className="pt-2.5 flex items-start gap-2 text-xs">
                            <span className="bg-blue-50 text-blue-600 px-2.5 py-1 font-bold rounded-lg text-[10px]">
                              {idx + 1}
                            </span>
                            <div className="flex-1 leading-normal">
                              <p className="font-bold text-slate-700">{source.title}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{source.organization}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* QUICK RETURN HOME BUTTON */}
            <button
              type="button"
              onClick={goHome}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold py-3.5 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition active:scale-99 shadow-sm text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Return to search
            </button>

          </div>
        )}

      </main>

      {/* FOOTER MEDICAL DISCLAIMER BAR */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 text-gray-400 text-[10px] font-bold py-3 px-5 text-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] leading-relaxed">
        <div className="max-w-xl mx-auto truncate-two-lines">
          {t('disclaimer_text')}
        </div>
      </footer>
    </div>
  );
}