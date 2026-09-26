import { AlertTriangle, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageDropdown } from './LanguageDropdown';

interface DisclaimerModalProps {
  onAgree: () => void;
}

export const DisclaimerModal = ({ onAgree }: DisclaimerModalProps) => {
  const { t } = useTranslation();

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
          onClick={onAgree}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-6 rounded-2xl transition shadow-lg shadow-blue-500/20 text-sm tracking-wide"
        >
          {t('i_agree')}
        </button>
      </div>
    </div>
  );
};
