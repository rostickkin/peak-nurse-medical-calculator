import { describe, it, expect } from 'vitest';
import { 
  getAgeInYears, 
  getCategoryGroup, 
  isMedicationWithdrawn, 
  calculateDoseResult
} from '../calculationEngine';
import type { Medication, Protocol } from '../../types/medication';

describe('Calculation Engine & Utilities', () => {
  it('should correctly convert age units to years', () => {
    expect(getAgeInYears('36', 'months')).toBe(3);
    expect(getAgeInYears('365', 'days')).toBe(1);
    expect(getAgeInYears('30', 'years')).toBe(30);
  });

  it('should identify category group', () => {
    expect(getCategoryGroup('Cephalosporin Antibiotic')).toBe('Antibiotics');
    expect(getCategoryGroup('Opioid Analgesic')).toBe('Analgesics');
    expect(getCategoryGroup('Corticosteroid')).toBe('Steroids');
  });

  it('should detect withdrawn medications', () => {
    const activeMed: Medication = {
      id: 'ondansetron',
      genericName: 'Ondansetron',
      brandNames: ['Zofran'],
      activeIngredient: 'Ondansetron',
      category: 'Antiemetic',
      isStrict: false,
      availableStrengths: [],
      indications: []
    };

    const withdrawnMed: Medication = {
      id: 'ranitidine',
      genericName: 'Ranitidine',
      brandNames: ['Zantac'],
      activeIngredient: 'Ranitidine',
      category: 'H2 Blocker (Withdrawn)',
      isStrict: false,
      availableStrengths: [],
      indications: [],
      verificationMeta: {
        clinicalStatus: 'REJECTED',
        thailandStatus: 'NOT_APPLICABLE',
        productionReady: false,
        verificationDate: '2026-09-18',
        verificationScope: 'Withdrawn NDMA',
        notes: 'Recalled worldwide'
      }
    };

    expect(isMedicationWithdrawn(activeMed)).toBe(false);
    expect(isMedicationWithdrawn(withdrawnMed)).toBe(true);
  });

  it('should calculate dose correctly and enforce maxSingleDoseMg cap', () => {
    const mockProtocol: Protocol = {
      id: 'test_peds',
      population: 'pediatric',
      populationLabel: { en: 'Pediatric', th: 'กุมาร', ru: 'Педиатрический' },
      route: 'IV',
      routeLabel: { en: 'IV', th: 'IV', ru: 'В/в' },
      requiredInputs: [{ id: 'weight', label: { en: 'Weight', th: 'น้ำหนัก', ru: 'Вес' }, type: 'number' }],
      doseType: 'weight_based',
      calculation: {
        unit: 'mg',
        rules: [{ condition: 'weight > 0', formula: 'weight * 10' }]
      },
      maxSingleDoseMg: 400,
      maxDailyDoseMg: 1200,
      frequency: { en: 'q8h', th: 'q8h', ru: 'q8h' },
      administration: { en: 'Slow IV', th: 'Slow IV', ru: 'Медленно' },
      renalAdjustment: { required: false, note: { en: '', th: '', ru: '' } },
      hepaticAdjustment: { required: false, note: { en: '', th: '', ru: '' } },
      sources: [],
      verificationStatus: 'verified'
    };

    // Weight = 30 -> 30 * 10 = 300 mg (< max 400)
    const res1 = calculateDoseResult(mockProtocol, 30, 90, 5);
    expect(res1.evaluatedDose).toBe(300);

    // Weight = 50 -> 50 * 10 = 500 mg (> max 400) -> Should cap at 400 mg
    const res2 = calculateDoseResult(mockProtocol, 50, 90, 10);
    expect(res2.evaluatedDose).toBe(400);
  });
});
