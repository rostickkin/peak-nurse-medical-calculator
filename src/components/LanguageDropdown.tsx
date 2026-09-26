import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageDropdownProps {
  align?: 'right' | 'center';
}

export const LanguageDropdown = ({ align = 'right' }: LanguageDropdownProps) => {
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
