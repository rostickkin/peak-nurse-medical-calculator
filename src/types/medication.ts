export interface Label {
  th: string;
  en: string;
  ru: string;
  [key: string]: string;
}

export interface AvailableStrength {
  id: string;
  label: Label;
  mgPerMl: number;
}

export interface RequiredInput {
  id: string;
  label: Label;
  type: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}

export interface Rule {
  condition: string;
  formula: string;
  explanationTemplate?: string;
}

export interface Calculation {
  unit: string;
  rules: Rule[];
}

export interface Frequency {
  th: string;
  en: string;
  ru: string;
  [key: string]: string;
}

export interface Administration {
  th: string;
  en: string;
  ru: string;
  [key: string]: string;
}

export interface RenalAdjustment {
  required: boolean;
  note: Label;
}

export interface HepaticAdjustment {
  required: boolean;
  note: Label;
}

export interface Warning {
  type: string;
  text: Label;
}

export interface Source {
  title: string;
  organization: string;
}

export interface Protocol {
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

export interface Indication {
  id: string;
  name: Label;
  protocols: Protocol[];
}

export interface VerificationMeta {
  clinicalStatus: string;
  thailandStatus: string;
  productionReady: boolean;
  verificationDate: string;
  verificationScope: string;
  notes: string;
  criticalIssues?: string[];
  majorChanges?: string[];
}

export interface Medication {
  id: string;
  genericName: string;
  brandNames: string[];
  activeIngredient: string;
  category: string;
  isStrict: boolean;
  availableStrengths: AvailableStrength[];
  indications: Indication[];
  verificationMeta?: VerificationMeta;
  isWithdrawn?: boolean;
}

export interface CategoryStyle {
  iconName: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
}
