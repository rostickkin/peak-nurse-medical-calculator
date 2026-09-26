import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Star } from 'lucide-react';
import database from './data/database.json';
import type { Medication } from './types/medication';
import { 
  getCategoryGroup, 
  getAgeInYears, 
  getActiveProtocol, 
  calculateDoseResult, 
  getValidationErrorString
} from './utils/calculationEngine';

// Sub-components
import { Header } from './components/Header';
import { DisclaimerModal } from './components/DisclaimerModal';
import { SearchBanner } from './components/SearchBanner';
import { CategoryGrid } from './components/CategoryGrid';
import { MedicationList } from './components/MedicationList';
import { CalculatorTab } from './components/CalculatorTab';
import { InformationTab } from './components/InformationTab';
import { ReferencesTab } from './components/ReferencesTab';

export default function App() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  
  // App Core States
  const [agreed, setAgreed] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  
  // Medication Details Tab states
  const [activeTab, setActiveTab] = useState<'calculator' | 'information' | 'references'>('calculator');
  const [selectedIndicationId, setSelectedIndicationId] = useState<string>('');
  const [age, setAge] = useState<string>('32');
  const [ageUnit, setAgeUnit] = useState<'years' | 'months' | 'days'>('years');
  const [weight, setWeight] = useState<string>('57');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [crcl, setCrcl] = useState<string>('45');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedStrengthId, setSelectedStrengthId] = useState<string>('');

  // Calculation Results & Validation
  const [showResult, setShowResult] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Local Storage (Favorites & Recents)
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

  const medications = database as Medication[];
  const currentMed = medications.find(m => m.id === selectedMedId);

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

    const med = medications.find(m => m.id === id);
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
        setWeight(weightInput?.defaultValue?.toString() || '70');

        const crclInput = firstProtocol.requiredInputs?.find(i => i.id === 'crcl');
        setCrcl(crclInput?.defaultValue?.toString() || '90');

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

  // Calculate Protocol & Results
  const ageYears = getAgeInYears(age, ageUnit);
  const activeProtocol = getActiveProtocol(currentMed, selectedIndicationId, selectedRoute, ageYears);

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

  const weightNum = parseFloat(weight) || 0;
  const crclNum = parseFloat(crcl) || 0;
  const { evaluatedDose, formulaSteps } = calculateDoseResult(
    showResult ? activeProtocol : null,
    weightNum,
    crclNum,
    ageYears
  );

  const selectedStrength = currentMed?.availableStrengths.find(s => s.id === selectedStrengthId);
  let evaluatedVolume: number | null = null;
  if (evaluatedDose !== null && selectedStrength && selectedStrength.mgPerMl > 0) {
    evaluatedVolume = evaluatedDose / selectedStrength.mgPerMl;
  }

  // --- DISCLAIMER SCREEN ---
  if (!agreed) {
    return <DisclaimerModal onAgree={() => setAgreed(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans antialiased">
      {/* HEADER */}
      <Header onGoHome={goHome} />

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4 pb-20">
        
        {/* ================= SCREEN 1: HOME SCREEN ================= */}
        {!selectedMedId && (
          <div className="space-y-6">
            {/* SEARCH BANNER WITH SMART PREFIX AUTOCOMPLETE */}
            <SearchBanner 
              search={search}
              setSearch={setSearch}
              medications={medications}
              onSelectMedication={selectMedication}
            />

            {/* CATEGORIES GRID */}
            <CategoryGrid 
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              medications={medications}
            />

            {/* RECENT & FAVORITES LIST */}
            <MedicationList 
              recentIds={recent}
              favoriteIds={favorites}
              medications={medications}
              onSelectMedication={selectMedication}
            />
          </div>
        )}

        {/* ================= SCREEN 2: MEDICATION DETAILS SCREEN ================= */}
        {selectedMedId && currentMed && (
          <div className="space-y-4">
            
            {/* BACK BUTTON & TOP BAR */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goHome}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-xl transition shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Drugs
              </button>

              <button
                type="button"
                onClick={() => toggleFavorite(currentMed.id)}
                className={`p-2 rounded-xl border transition ${
                  favorites.includes(currentMed.id)
                    ? 'bg-amber-50 border-amber-200 text-amber-500'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
                }`}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* MEDICATION CARD HEADER */}
            <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {getCategoryGroup(currentMed.category)}
                  </span>
                  <h2 className="text-xl font-black text-gray-900 mt-1">{currentMed.genericName}</h2>
                  <p className="text-xs font-semibold text-gray-400">
                    {currentMed.brandNames?.[0] ? `${currentMed.brandNames[0]} · ` : ''}{currentMed.activeIngredient}
                  </p>
                </div>
              </div>

              {/* TABS SELECTOR (Calculator | Information | References) */}
              <div className="flex bg-slate-100 p-1 rounded-2xl mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('calculator')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'calculator' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Calculator
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('information')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'information' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Information
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('references')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === 'references' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  References
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'calculator' && (
              <CalculatorTab 
                med={currentMed}
                selectedIndicationId={selectedIndicationId}
                setSelectedIndicationId={handleIndicationChange}
                selectedRoute={selectedRoute}
                setSelectedRoute={setSelectedRoute}
                selectedStrengthId={selectedStrengthId}
                setSelectedStrengthId={setSelectedStrengthId}
                age={age}
                setAge={setAge}
                ageUnit={ageUnit}
                setAgeUnit={setAgeUnit}
                weight={weight}
                setWeight={setWeight}
                crcl={crcl}
                setCrcl={setCrcl}
                gender={gender}
                setGender={setGender}
                activeProtocol={activeProtocol}
                showResult={showResult}
                validationError={validationError}
                onCalculate={handleCalculate}
                evaluatedDose={evaluatedDose}
                evaluatedVolume={evaluatedVolume}
                formulaSteps={formulaSteps}
              />
            )}

            {activeTab === 'information' && (
              <InformationTab 
                med={currentMed}
                activeProtocol={activeProtocol}
              />
            )}

            {activeTab === 'references' && (
              <ReferencesTab 
                med={currentMed}
                activeProtocol={activeProtocol}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}