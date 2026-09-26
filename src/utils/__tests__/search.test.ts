import { describe, it, expect } from 'vitest';
import { filterMedicationsByPrefixSearch } from '../calculationEngine';
import type { Medication } from '../../types/medication';

describe('Smart Prefix Search', () => {
  const sampleMeds: Medication[] = [
    { id: 'amoxicillin', genericName: 'Amoxicillin', brandNames: ['Amoxil'], activeIngredient: 'Amoxicillin', category: 'Antibiotic', isStrict: false, availableStrengths: [], indications: [] },
    { id: 'ampicillin', genericName: 'Ampicillin', brandNames: ['Unasyn'], activeIngredient: 'Ampicillin', category: 'Antibiotic', isStrict: false, availableStrengths: [], indications: [] },
    { id: 'amikacin', genericName: 'Amikacin', brandNames: ['Amikin'], activeIngredient: 'Amikacin', category: 'Aminoglycoside', isStrict: false, availableStrengths: [], indications: [] },
    { id: 'paracetamol_iv', genericName: 'Paracetamol IV', brandNames: ['Perfalgan'], activeIngredient: 'Paracetamol', category: 'Analgesic', isStrict: false, availableStrengths: [], indications: [] },
    { id: 'ceftriaxone', genericName: 'Ceftriaxone', brandNames: ['Rocephin'], activeIngredient: 'Ceftriaxone', category: 'Antibiotic', isStrict: false, availableStrengths: [], indications: [] },
  ];

  it('should filter drugs starting with letter "a"', () => {
    const results = filterMedicationsByPrefixSearch(sampleMeds, 'a');
    expect(results.length).toBe(3);
    const names = results.map(m => m.genericName);
    expect(names).toContain('Amoxicillin');
    expect(names).toContain('Ampicillin');
    expect(names).toContain('Amikacin');
    expect(names).not.toContain('Paracetamol IV');
  });

  it('should filter drugs starting with 2 letters "am"', () => {
    const results = filterMedicationsByPrefixSearch(sampleMeds, 'am');
    expect(results.length).toBe(3);
  });

  it('should filter drugs starting with "amo"', () => {
    const results = filterMedicationsByPrefixSearch(sampleMeds, 'amo');
    expect(results.length).toBe(1);
    expect(results[0].genericName).toBe('Amoxicillin');
  });

  it('should match brand names starting with prefix', () => {
    const results = filterMedicationsByPrefixSearch(sampleMeds, 'roc');
    expect(results.length).toBe(1);
    expect(results[0].genericName).toBe('Ceftriaxone');
  });
});
