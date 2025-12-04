
export enum Recommendation {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
}

export interface Annotation {
  type: 'arrow' | 'line';
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface AnalysisResult {
  prediction: string;
  recommendation: Recommendation;
  confidence: number;
  rationale: string;
  annotation: Annotation;
}
