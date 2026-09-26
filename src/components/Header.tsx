import { LanguageDropdown } from './LanguageDropdown';

interface HeaderProps {
  onGoHome: () => void;
}

export const Header = ({ onGoHome }: HeaderProps) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-xl mx-auto w-full px-5 py-3.5 flex items-center justify-between">
        <button type="button" onClick={onGoHome} className="flex items-center gap-3 active:scale-95 transition">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-9 h-9 object-contain" />
          <div className="text-left leading-tight">
            <h1 className="text-sm font-black text-blue-600 tracking-wide uppercase">PEAK NURSE</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Medical Calculator</p>
          </div>
        </button>
        
        <LanguageDropdown align="right" />
      </div>
    </header>
  );
};
