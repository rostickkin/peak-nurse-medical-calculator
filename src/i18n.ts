import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  th: {
    translation: {
      "app_name": "Peak Nurse Medical Calculator",
      "disclaimer_title": "คำเตือนทางการแพทย์",
      "disclaimer_text": "แอปพลิเคชันนี้มีไว้เพื่อให้ข้อมูลเบื้องต้นเท่านั้น ห้ามใช้แทนการวินิจฉัยทางการแพทย์ กรุณาตรวจสอบกับแพทย์หรือเภสัชกรทุกครั้งก่อนตัดสินใจ.",
      "i_agree": "ฉันยอมรับ",
      "search_placeholder": "ค้นหายา...",
      "calculate": "คำนวณ",
      "reset": "เริ่มใหม่",
      "result": "ผลลัพธ์",
      "language": "ภาษา",
      "strict_med": "ยาควบคุมพิเศษ",
      "calculation_info": "รายละเอียดการคำนวณ:"
    }
  },
  en: {
    translation: {
      "app_name": "Peak Nurse Medical Calculator",
      "disclaimer_title": "Medical Disclaimer",
      "disclaimer_text": "This application provides preliminary information only and is not a substitute for professional medical advice. Always consult a physician or pharmacist before making any medical decisions.",
      "i_agree": "I Agree",
      "search_placeholder": "Search medication...",
      "calculate": "Calculate",
      "reset": "Reset",
      "result": "Result",
      "language": "Language",
      "strict_med": "Strict Control Medication",
      "calculation_info": "Calculation Details:"
    }
  },
  ru: {
    translation: {
      "app_name": "Peak Nurse Medical Calculator",
      "disclaimer_title": "Медицинское предупреждение",
      "disclaimer_text": "Это приложение предоставляет только предварительную информацию и не заменяет профессиональную медицинскую консультацию. Всегда консультируйтесь с врачом перед принятием решений.",
      "i_agree": "Я согласен(на)",
      "search_placeholder": "Поиск препарата...",
      "calculate": "Рассчитать",
      "reset": "Сбросить",
      "result": "Результат",
      "language": "Язык",
      "strict_med": "Препарат строгого учета",
      "calculation_info": "Формула расчета:"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "th",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
