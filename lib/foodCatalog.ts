import pantryData from "@/data/pantry.json";
import unitsData from "@/data/units.json";
import { round } from "./utils";

export type FoodUnit = "g" | "ml" | "tsp" | "tbsp";

export type UnitKind = "mass" | "volume";

export interface UnitDefinition {
  id: FoodUnit;
  label: string;
  short: string;
  kind: UnitKind;
  /** For volume units: milliliters represented by 1 unit */
  mlPerUnit?: number;
}

export interface MacroProfile {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium?: number;
}

/** Nutrition defined for `baseAmount` of `baseUnit` (e.g. per 100g). */
export interface CatalogFood {
  id: string;
  name: string;
  baseUnit: FoodUnit;
  baseAmount: number;
  nutrition: MacroProfile;
  defaultAmount: number;
  /** Approximate ml density for g ↔ ml when needed */
  mlPerGram?: number;
  notes?: string;
  chipLabel?: string;
}

export interface ScaledFood {
  name: string;
  amount: number;
  unit: FoodUnit;
  weightGrams?: number;
  volumeMl?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium?: number;
  notes?: string;
  catalogId?: string;
}

export const UNIT_DEFINITIONS: UnitDefinition[] = unitsData as UnitDefinition[];

export const ALL_FOOD_UNITS: FoodUnit[] = UNIT_DEFINITIONS.map((u) => u.id);

export const FOOD_CATALOG: CatalogFood[] = pantryData as CatalogFood[];

const unitById = new Map(UNIT_DEFINITIONS.map((u) => [u.id, u]));

export function getUnitDefinition(unit: FoodUnit): UnitDefinition | undefined {
  return unitById.get(unit);
}

export function toMilliliters(amount: number, unit: FoodUnit): number | null {
  const def = unitById.get(unit);
  if (!def || def.kind !== "volume" || def.mlPerUnit == null) return null;
  return amount * def.mlPerUnit;
}

/** Scale factor for custom foods: nutrition is per 100g or per 100ml. */
export function customPortionFactor(amount: number, unit: FoodUnit): number {
  if (amount <= 0) return 0;
  if (unit === "g") return amount / 100;
  const ml = toMilliliters(amount, unit);
  if (ml != null) return ml / 100;
  return amount / 100;
}

export function customBaseNutritionHint(unit: FoodUnit): string {
  if (unit === "g") return "Per 100g";
  return "Per 100ml";
}

function toBaseEquivalent(
  food: CatalogFood,
  amount: number,
  unit: FoodUnit,
): number {
  if (amount <= 0) return 0;

  if (unit === food.baseUnit) {
    return amount;
  }

  const asMl = toMilliliters(amount, unit);

  if (food.baseUnit === "ml" && asMl != null) {
    return asMl;
  }

  if (food.baseUnit === "ml" && unit === "g") {
    return amount; // ~1 g/ml for liquids
  }
  if (food.baseUnit === "g" && unit === "ml") {
    return amount;
  }
  if (food.baseUnit === "g" && asMl != null) {
    return food.mlPerGram ? asMl / food.mlPerGram : asMl;
  }

  return amount;
}

export function scaleNutrition(
  food: CatalogFood,
  amount: number,
  unit: FoodUnit,
): MacroProfile {
  const equivalent = toBaseEquivalent(food, amount, unit);
  const factor = food.baseAmount > 0 ? equivalent / food.baseAmount : 0;

  return {
    calories: round(food.nutrition.calories * factor, 1),
    protein: round(food.nutrition.protein * factor, 1),
    carbs: round(food.nutrition.carbs * factor, 1),
    fat: round(food.nutrition.fat * factor, 1),
    sodium: round(food.nutrition.sodium * factor, 1),
    potassium:
      food.nutrition.potassium != null
        ? round(food.nutrition.potassium * factor, 1)
        : undefined,
  };
}

export function buildScaledFood(
  food: CatalogFood,
  amount: number,
  unit: FoodUnit,
  notes?: string,
): ScaledFood {
  const macros = scaleNutrition(food, amount, unit);
  const asMl = toMilliliters(amount, unit);
  const weightGrams = unit === "g" ? amount : undefined;
  const volumeMl = asMl != null ? round(asMl, 1) : undefined;

  return {
    name: food.name,
    amount,
    unit,
    weightGrams,
    volumeMl,
    ...macros,
    notes: notes || food.notes,
    catalogId: food.id,
  };
}

export function unitLabel(unit: FoodUnit): string {
  return unitById.get(unit)?.short ?? unit;
}

export function unitOptionLabel(unit: FoodUnit): string {
  return unitById.get(unit)?.label ?? unit;
}

export function baseUnitHint(food: CatalogFood): string {
  return `per ${food.baseAmount}${unitLabel(food.baseUnit)}`;
}
