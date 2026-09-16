import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Search, ChevronLeft, Globe, Info } from 'lucide-react';
import database from './data/database.json';

// --- TYPES ---
type InputField = { id: string; label: Record<string, string>; type: string; min?: number; max?: number };
type Rule = { condition: string; formula: string };
type Medication = {
  id: string;
  name: Record<string, string>;
  isStrict: boolean;
  inputs: InputField[];
  calculation: { unit: string; rules: Rule[] };
};

// --- CUSTOM DROPDOWN COMPONENT ---
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
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition"
      >
        <img src={current.flag} alt={current.label} className="w-5 h-auto rounded-sm shadow-sm" />
        <span className="font-medium text-sm">{current.label}</span>
      </button>
      
      {isOpen && (
        <div className={`absolute mt-2 w-28 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 ${align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0'}`}>
          {langs.map(lang => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setIsOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
            >
              <img src={lang.flag} alt={lang.label} className="w-5 h-auto rounded-sm shadow-sm" />
              <span className="font-medium">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const { t, i18n } = useTranslation();
  
  // App State
  const [agreed, setAgreed] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  
  // Form State
  const [inputValues, setInputValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  // Evaluate the dynamic formula safely
  const calculateResult = (med: Medication, values: Record<string, number>) => {
    try {
      const keys = Object.keys(values);
      const args = Object.values(values);
      
      for (const rule of med.calculation.rules) {
        // Evaluate condition
        const conditionFunc = new Function(...keys, `return ${rule.condition};`);
        const conditionMet = conditionFunc(...args);
        
        if (conditionMet) {
          // Evaluate formula
          const formulaFunc = new Function(...keys, `return ${rule.formula};`);
          const res = formulaFunc(...args);
          setResult(res);

          // Generate explanation text
          let exp = rule.formula;
          for (const [key, val] of Object.entries(values)) {
            exp = exp.replace(new RegExp('\\b' + key + '\\b', 'g'), val.toString());
          }
          setExplanation(exp);
          return;
        }
      }
      setResult(null); // No rule matched
      setExplanation(null);
    } catch (error) {
      console.error("Calculation Error:", error);
      setResult(null);
      setExplanation(null);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    const num = parseFloat(value);
    const newValues = { ...inputValues, [id]: isNaN(num) ? 0 : num };
    setInputValues(newValues);
    if (selectedMed) {
      calculateResult(selectedMed, newValues);
    }
  };

  // --- DISCLAIMER SCREEN ---
  if (!agreed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center border-t-4 border-clinic-blue">
          <img src={`${import.meta.env.BASE_URL}nurse.png`} alt="Nurse" className="w-40 h-40 object-contain mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('disclaimer_title')}</h1>
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-left">
            <AlertTriangle className="w-5 h-5 text-clinic-red flex-shrink-0 mt-0.5" />
            <p className="text-gray-600 text-sm">{t('disclaimer_text')}</p>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-8">
            <Globe className="w-5 h-5 text-gray-400" />
            <LanguageDropdown align="center" />
          </div>

          <button 
            onClick={() => setAgreed(true)}
            className="w-full bg-clinic-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition"
          >
            {t('i_agree')}
          </button>
        </div>
      </div>
    );
  }

  const currentLang = i18n.language;
  const filteredMeds = (database as Medication[]).filter(med => 
    med.name[currentLang]?.toLowerCase().includes(search.toLowerCase())
  );

  const goHome = () => { setSelectedMed(null); setResult(null); setExplanation(null); setInputValues({}); };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      {/* HEADER — always static */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto w-full px-4 py-4 flex items-center justify-between">
          <button onClick={goHome} className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-9 h-9 object-contain" />
            <h1 className="text-lg font-bold text-gray-800">{t('app_name')}</h1>
          </button>
          {/* Language Switcher in Header */}
          <LanguageDropdown align="right" />
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {/* SCREEN 1: LIST */}
        {!selectedMed && (
          <div className="space-y-4">
            {/* Welcome banner — fixed height */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 h-28">
              <img src={`${import.meta.env.BASE_URL}nurse.png`} alt="Nurse" className="w-20 h-20 object-contain flex-shrink-0" />
              <div>
                <h2 className="font-bold text-gray-800 text-base">{t('app_name')}</h2>
                <p className="text-gray-500 text-xs mt-1">{t('search_placeholder')}</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-clinic-blue"
              />
            </div>

            <div className="space-y-2">
              {filteredMeds.map(med => (
                <button 
                  key={med.id}
                  onClick={() => setSelectedMed(med)}
                  className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-clinic-blue transition text-left"
                >
                  <span className="font-semibold text-gray-800">{med.name[currentLang]}</span>
                  {med.isStrict && <AlertTriangle className="w-5 h-5 text-clinic-red" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 2: CALCULATOR */}
        {selectedMed && (
          <div className="space-y-4">
            {/* Med header card — same fixed height as welcome banner, illustration clickable */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 h-28">
              <button onClick={goHome} className="flex-shrink-0">
                <img src={`${import.meta.env.BASE_URL}nurse.png`} alt="Nurse" className="w-20 h-20 object-contain" />
              </button>
              <div className="flex-1 min-w-0">
                <button
                  onClick={goHome}
                  className="flex items-center gap-1 text-clinic-blue text-xs font-medium mb-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('search_placeholder')}
                </button>
                <h2 className="font-bold text-gray-800 text-base leading-tight truncate">{selectedMed.name[currentLang]}</h2>
              </div>
            </div>

            {selectedMed.isStrict && (
              <div className="bg-red-50 border border-clinic-red/20 rounded-xl p-3 flex items-center gap-2 text-clinic-red text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{t('strict_med')}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
              {selectedMed.inputs.map(input => (
                <div key={input.id}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {input.label[currentLang]}
                  </label>
                  <input
                    type="number"
                    min={input.min}
                    max={input.max}
                    placeholder="0"
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                    className="w-full text-lg bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-clinic-blue"
                  />
                </div>
              ))}
            </div>

            {/* RESULT */}
            {result !== null && (
              <div className="bg-clinic-green/10 border-2 border-clinic-green rounded-2xl p-6 text-center">
                <p className="text-clinic-green font-medium mb-1">{t('result')}</p>
                <div className="text-4xl font-bold text-gray-900">
                  {Number.isInteger(result) ? result : result.toFixed(2)} <span className="text-xl text-gray-500">{selectedMed.calculation.unit}</span>
                </div>
                
                {explanation && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3 text-blue-800 text-sm text-left">
                    <Info className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" />
                    <div>
                      <span className="font-semibold block mb-1">{t('calculation_info')}</span>
                      <code className="bg-blue-100 px-2 py-1 rounded font-mono break-all">
                        {explanation} = {Number.isInteger(result) ? result : result.toFixed(2)} {selectedMed.calculation.unit}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search button — always at the bottom */}
            <button
              onClick={goHome}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:border-clinic-blue hover:text-clinic-blue transition"
            >
              <Search className="w-4 h-4" />
              {t('search_placeholder')}
            </button>
          </div>
        )}
      </main>

      {/* FOOTER DISCLAIMER */}
      <footer className="fixed bottom-0 w-full bg-gray-800 text-gray-300 text-xs p-3 text-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {t('disclaimer_text')}
      </footer>
    </div>
  );
}
