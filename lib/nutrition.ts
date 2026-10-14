import type {
  DailyLog,
  FoodItem,
  MealEntry,
  NutritionTargets,
  UserProfile,
} from "@/types";
import { DEFAULT_SODIUM_LIMIT_MG } from "@/types";
import { clamp, round } from "./utils";

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium: number;
}

export function emptyTotals(): MacroTotals {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sodium: 0,
    potassium: 0,
  };
}

export function sumFoodItems(items: FoodItem[]): MacroTotals {
  return items.reduce<MacroTotals>((acc, item) => {
    acc.calories += item.calories || 0;
    acc.protein += item.protein || 0;
    acc.carbs += item.carbs || 0;
    acc.fat += item.fat || 0;
    acc.sodium += item.sodium || 0;
    acc.potassium += item.potassium || 0;
    return acc;
  }, emptyTotals());
}

export function sumMeal(meal: MealEntry): MacroTotals {
  return sumFoodItems(meal.items);
}

export function sumDailyLog(log: DailyLog | undefined): MacroTotals {
  if (!log) return emptyTotals();
  return log.meals.reduce<MacroTotals>((acc, meal) => {
    const t = sumMeal(meal);
    acc.calories += t.calories;
    acc.protein += t.protein;
    acc.carbs += t.carbs;
    acc.fat += t.fat;
    acc.sodium += t.sodium;
    acc.potassium += t.potassium;
    return acc;
  }, emptyTotals());
}

/** Mifflin–St Jeor BMR using sex-neutral midpoint of male/female formulas. */
export function estimateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return (male + female) / 2;
}

/**
 * Baseline TDEE + macros tailored for metabolic stability / insulin resistance:
 * high protein, controlled carbs, moderate fat, strict sodium ceiling.
 */
export function calculateTargets(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  targetWeightKg?: number;
  healthConditions: string[];
}): NutritionTargets {
  const { weightKg, heightCm, age, targetWeightKg, healthConditions } = input;
  const bmr = estimateBmr(weightKg, heightCm, age);
  // Light–moderate activity multiplier
  let tdee = bmr * 1.375;

  const goalWeight = targetWeightKg ?? weightKg;
  if (goalWeight < weightKg - 0.5) {
    tdee -= 350; // gentle deficit
  } else if (goalWeight > weightKg + 0.5) {
    tdee += 250;
  }

  const hasInsulin =
    healthConditions.includes("Insulin Resistance") ||
    healthConditions.includes("Type 2 Diabetes") ||
    healthConditions.includes("Fatty Liver");

  const hasHypertensionOrRenal =
    healthConditions.includes("Hypertension") ||
    healthConditions.includes("Renal Health");

  const calories = clamp(round(tdee), 1400, 3200);

  // Protein: 1.8–2.0 g/kg for IR / metabolic stability
  const proteinPerKg = hasInsulin ? 2.0 : 1.8;
  const proteinGrams = round(weightKg * proteinPerKg);

  // Controlled carbs (~30–35% kcal when IR), else ~40%
  const carbPct = hasInsulin ? 0.32 : 0.4;
  const carbsGrams = round((calories * carbPct) / 4);

  const proteinKcal = proteinGrams * 4;
  const carbKcal = carbsGrams * 4;
  const fatKcal = Math.max(calories - proteinKcal - carbKcal, calories * 0.25);
  const fatGrams = round(fatKcal / 9);

  const sodiumLimitMg = DEFAULT_SODIUM_LIMIT_MG;

  const potassiumTargetMg = hasHypertensionOrRenal ? 3500 : undefined;

  return {
    calories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    sodiumLimitMg,
    potassiumTargetMg,
  };
}

export type SodiumLevel = "safe" | "caution" | "danger";

export function sodiumLevel(
  currentMg: number,
  limitMg = DEFAULT_SODIUM_LIMIT_MG,
): SodiumLevel {
  if (currentMg > limitMg) return "danger";
  if (currentMg >= 1000) return "caution";
  return "safe";
}

export function progressRatio(current: number, target: number): number {
  if (target <= 0) return 0;
  return clamp(current / target, 0, 1.5);
}

export function defaultProfile(): UserProfile {
  return {
    name: "",
    age: 30,
    heightCm: 170,
    currentWeightKg: 70,
    targetWeightKg: undefined,
    healthConditions: [],
    targets: {
      calories: 2000,
      proteinGrams: 140,
      carbsGrams: 180,
      fatGrams: 65,
      sodiumLimitMg: DEFAULT_SODIUM_LIMIT_MG,
    },
    onboardingCompleted: false,
  };
}
