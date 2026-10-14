export type MealType =
  | "pre_workout"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack";

export interface NutritionTargets {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  sodiumLimitMg: number;
  potassiumTargetMg?: number;
}

export interface UserProfile {
  name: string;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number;
  healthConditions: string[];
  targets: NutritionTargets;
  onboardingCompleted: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  weightGrams?: number;
  volumeMl?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium?: number;
  notes?: string;
}

export interface MealEntry {
  id: string;
  mealType: MealType;
  time: string;
  items: FoodItem[];
}

export interface DailyLog {
  date: string;
  meals: MealEntry[];
}

export interface AppExportData {
  version: 1;
  exportedAt: string;
  profile: UserProfile;
  logs: DailyLog[];
}

export const HEALTH_CONDITIONS = [
  "Hypertension",
  "Insulin Resistance",
  "Fatty Liver",
  "Renal Health",
  "Type 2 Diabetes",
  "High Cholesterol",
] as const;

export const MEAL_LABELS: Record<MealType, string> = {
  pre_workout: "Pre-Workout",
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

export const MEAL_ORDER: MealType[] = [
  "pre_workout",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export const DEFAULT_SODIUM_LIMIT_MG = 1500;

export const STORAGE_KEYS = {
  profile: "paakam_profile",
  logs: "paakam_logs",
} as const;
