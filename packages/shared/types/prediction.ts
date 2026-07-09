export interface PredictionClass {
  class_name: string;
  confidence: number;
}

export interface PredictionResult {
  class_name: string;
  display_name: string;
  confidence: number;
  is_confident: boolean;
  top_k: PredictionClass[];
}

export interface ScanResult {
  id: string;
  image_url: string;
  timestamp: string;
}

export interface AdviceTreatment {
  chemical: string[];
  organic: string[];
  cultural: string[];
}

export interface AdviceNutrients {
  nitrogen: string | null;
  phosphorus: string | null;
  potassium: string | null;
  calcium: string | null;
  recommendations: string | null;
}

export interface AdvicePruning {
  when: string | null;
  how: string | null;
  frequency: string | null;
}

export interface Advice {
  crop: string;
  disease: string;
  status: 'healthy' | 'diseased';
  scientific_name: string | null;
  description: string | null;
  symptoms: string[];
  treatment: AdviceTreatment;
  nutrients: AdviceNutrients;
  prevention: string[];
  pruning: AdvicePruning;
}

export interface PredictResponse {
  prediction: PredictionResult;
  advice: Advice | null;
  scan: ScanResult | null;
}

export interface ScanHistoryItem {
  id: string;
  class_name: string;
  confidence: number;
  top_k: PredictionClass[];
  image_url: string;
  timestamp: string;
}

export interface ScanHistoryResponse {
  scans: ScanHistoryItem[];
  total: number;
}
