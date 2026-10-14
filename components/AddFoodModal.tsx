"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import type { FoodItem, MealType } from "@/types";
import { MEAL_LABELS, MEAL_ORDER } from "@/types";
import { useHealth } from "@/context/HealthContext";
import {
  ALL_FOOD_UNITS,
  baseUnitHint,
  buildScaledFood,
  customBaseNutritionHint,
  customPortionFactor,
  scaleNutrition,
  toMilliliters,
  unitLabel,
  type CatalogFood,
  type FoodUnit,
  type ScaledFood,
} from "@/lib/foodCatalog";
import { generateId, round } from "@/lib/utils";
import { PantryPresets } from "./PantryPresets";
import { UnitSelect } from "./UnitSelect";

interface DraftItem extends ScaledFood {
  draftId: string;
}

interface AddFoodModalProps {
  open: boolean;
  onClose: () => void;
}

function emptyCustom() {
  return {
    name: "",
    amount: "100",
    unit: "g" as FoodUnit,
    caloriesPerBase: "",
    proteinPerBase: "",
    carbsPerBase: "",
    fatPerBase: "",
    sodiumPerBase: "",
    notes: "",
  };
}

function emptyMacros() {
  return {
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    sodium: "",
  };
}

type MacroFields = ReturnType<typeof emptyMacros>;

export function AddFoodModal({ open, onClose }: AddFoodModalProps) {
  const { addFoodsToMeal } = useHealth();
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [selectedFood, setSelectedFood] = useState<CatalogFood | null>(null);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<FoodUnit>("g");
  const [notes, setNotes] = useState("");
  const [macros, setMacros] = useState<MacroFields>(emptyMacros);
  const [custom, setCustom] = useState(emptyCustom);
  const [draft, setDraft] = useState<DraftItem[]>([]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDraft([]);
      setSelectedFood(null);
      setAmount("");
      setNotes("");
      setMacros(emptyMacros());
      setCustom(emptyCustom());
      setMode("catalog");
    }
  }, [open]);

  // Auto-fill editable macros when pantry food / amount / unit changes.
  useEffect(() => {
    if (mode !== "catalog" || !selectedFood) return;
    const qty = Number(amount) || 0;
    const scaled = scaleNutrition(selectedFood, qty, unit);
    setMacros({
      calories: String(scaled.calories),
      protein: String(scaled.protein),
      carbs: String(scaled.carbs),
      fat: String(scaled.fat),
      sodium: String(scaled.sodium),
    });
  }, [mode, selectedFood, amount, unit]);

  const customPreview = useMemo(() => {
    if (mode !== "custom") return null;
    const qty = Number(custom.amount) || 0;
    const factor = customPortionFactor(qty, custom.unit);
    return {
      calories: round((Number(custom.caloriesPerBase) || 0) * factor, 1),
      protein: round((Number(custom.proteinPerBase) || 0) * factor, 1),
      carbs: round((Number(custom.carbsPerBase) || 0) * factor, 1),
      fat: round((Number(custom.fatPerBase) || 0) * factor, 1),
      sodium: round((Number(custom.sodiumPerBase) || 0) * factor, 1),
    };
  }, [mode, custom]);

  function setMacroField(key: keyof MacroFields, value: string) {
    setMacros((m) => ({ ...m, [key]: value }));
  }

  function recalculateMacros() {
    if (!selectedFood) return;
    const qty = Number(amount) || 0;
    const scaled = scaleNutrition(selectedFood, qty, unit);
    setMacros({
      calories: String(scaled.calories),
      protein: String(scaled.protein),
      carbs: String(scaled.carbs),
      fat: String(scaled.fat),
      sodium: String(scaled.sodium),
    });
  }

  const draftTotals = useMemo(
    () =>
      draft.reduce(
        (acc, item) => {
          acc.calories += item.calories;
          acc.protein += item.protein;
          acc.carbs += item.carbs;
          acc.fat += item.fat;
          acc.sodium += item.sodium;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
      ),
    [draft],
  );

  if (!open) return null;

  function selectFood(food: CatalogFood) {
    setMode("catalog");
    setSelectedFood(food);
    setUnit(food.baseUnit);
    setAmount(String(food.defaultAmount));
    setNotes(food.notes ?? "");
  }

  function clearPicker() {
    setSelectedFood(null);
    setAmount("");
    setNotes("");
    setMacros(emptyMacros());
  }

  function queueCatalogItem() {
    if (!selectedFood) return;
    const qty = Number(amount);
    if (!qty || qty <= 0) return;

    const scaled = buildScaledFood(
      selectedFood,
      qty,
      unit,
      notes.trim() || undefined,
    );
    // Prefer manually edited macros over pure catalog scale.
    const item: DraftItem = {
      ...scaled,
      calories: Number(macros.calories) || 0,
      protein: Number(macros.protein) || 0,
      carbs: Number(macros.carbs) || 0,
      fat: Number(macros.fat) || 0,
      sodium: Number(macros.sodium) || 0,
      draftId: generateId(),
    };
    setDraft((prev) => [...prev, item]);
    clearPicker();
  }

  function queueCustomItem() {
    const name = custom.name.trim();
    const qty = Number(custom.amount);
    if (!name || !qty || qty <= 0) return;

    const factor = customPortionFactor(qty, custom.unit);
    const macros = {
      calories: round((Number(custom.caloriesPerBase) || 0) * factor, 1),
      protein: round((Number(custom.proteinPerBase) || 0) * factor, 1),
      carbs: round((Number(custom.carbsPerBase) || 0) * factor, 1),
      fat: round((Number(custom.fatPerBase) || 0) * factor, 1),
      sodium: round((Number(custom.sodiumPerBase) || 0) * factor, 1),
    };
    const asMl = toMilliliters(qty, custom.unit);

    const item: DraftItem = {
      draftId: generateId(),
      name,
      amount: qty,
      unit: custom.unit,
      weightGrams: custom.unit === "g" ? qty : undefined,
      volumeMl: asMl != null ? round(asMl, 1) : undefined,
      ...macros,
      notes: custom.notes.trim() || undefined,
    };

    setDraft((prev) => [...prev, item]);
    setCustom(emptyCustom());
  }

  function removeDraft(draftId: string) {
    setDraft((prev) => prev.filter((d) => d.draftId !== draftId));
  }

  function toFoodItem(item: ScaledFood): Omit<FoodItem, "id"> {
    const unitNote = `${item.amount}${unitLabel(item.unit)}`;

    return {
      name: item.name,
      weightGrams: item.weightGrams,
      volumeMl: item.volumeMl,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      sodium: item.sodium,
      potassium: item.potassium,
      notes: [item.notes, `Portion: ${unitNote}`].filter(Boolean).join(" · "),
    };
  }

  function saveAll() {
    if (draft.length === 0) return;
    addFoodsToMeal(
      mealType,
      draft.map((item) => toFoodItem(item)),
    );
    setDraft([]);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-food-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[1.75rem] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sheet)] animate-sheet-up sm:rounded-3xl"
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div>
            <h2 id="add-food-title" className="text-lg font-semibold tracking-tight">
              Quick add
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Queue foods · nutrition scales by units
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[var(--surface-2)] p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
              Meal
            </p>
            <div className="flex flex-wrap gap-2">
              {MEAL_ORDER.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`chip ${mealType === type ? "chip-active" : ""}`}
                >
                  {MEAL_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1 rounded-full bg-[var(--surface-2)] p-1">
            <button
              type="button"
              onClick={() => setMode("catalog")}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
                mode === "catalog"
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "text-[var(--muted)]"
              }`}
            >
              From pantry
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("custom");
                setSelectedFood(null);
              }}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
                mode === "custom"
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "text-[var(--muted)]"
              }`}
            >
              Custom food
            </button>
          </div>

          {mode === "catalog" && (
            <>
              <PantryPresets
                selectedId={selectedFood?.id}
                onSelect={selectFood}
              />

              {selectedFood ? (
                <div className="card space-y-4 !bg-[var(--background)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold tracking-tight">
                        {selectedFood.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        Reference: {baseUnitHint(selectedFood)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearPicker}
                      className="text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_minmax(9.5rem,auto)] gap-3">
                    <label className="block">
                      <span className="label">Amount</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="field"
                        autoFocus
                      />
                    </label>
                    <label className="block">
                      <span className="label">Unit</span>
                      <UnitSelect
                        value={unit}
                        options={ALL_FOOD_UNITS}
                        onChange={setUnit}
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                        Nutrition for {amount || 0}
                        {unitLabel(unit)}
                      </p>
                      <button
                        type="button"
                        onClick={recalculateMacros}
                        className="text-xs font-semibold text-[var(--accent)]"
                      >
                        Recalculate
                      </button>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      Auto-filled from amount — edit any value manually.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ["calories", "Calories"],
                          ["protein", "Protein (g)"],
                          ["carbs", "Carbs (g)"],
                          ["fat", "Fat (g)"],
                          ["sodium", "Sodium (mg)"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="block">
                          <span className="label">{label}</span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            inputMode="decimal"
                            value={macros[key]}
                            onChange={(e) => setMacroField(key, e.target.value)}
                            className="field"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="label">Notes</span>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional"
                      className="field"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={queueCatalogItem}
                    disabled={!amount || Number(amount) <= 0}
                    className="btn-primary w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Add to list
                  </button>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--muted)]">
                  Tap a staple, set amount + unit, then add it to the list.
                </p>
              )}
            </>
          )}

          {mode === "custom" && (
            <div className="card space-y-4 !bg-[var(--background)]">
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                Enter nutrition per 100g / 100ml. tsp / tbsp scale from 100ml (1
                tsp = 5ml, 1 tbsp = 15ml).
              </p>
              <label className="block">
                <span className="label">Item name</span>
                <input
                  value={custom.name}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, name: e.target.value }))
                  }
                  placeholder="e.g. Homemade stew"
                  className="field"
                />
              </label>

              <div className="grid grid-cols-[1fr_minmax(9.5rem,auto)] gap-3">
                <label className="block">
                  <span className="label">Portion amount</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={custom.amount}
                    onChange={(e) =>
                      setCustom((c) => ({ ...c, amount: e.target.value }))
                    }
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="label">Unit</span>
                  <UnitSelect
                    value={custom.unit}
                    options={ALL_FOOD_UNITS}
                    onChange={(u) => setCustom((c) => ({ ...c, unit: u }))}
                  />
                </label>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                {customBaseNutritionHint(custom.unit)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["caloriesPerBase", "Calories"],
                    ["proteinPerBase", "Protein (g)"],
                    ["carbsPerBase", "Carbs (g)"],
                    ["fatPerBase", "Fat (g)"],
                    ["sodiumPerBase", "Sodium (mg)"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="label">{label}</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={custom[key]}
                      onChange={(e) =>
                        setCustom((c) => ({ ...c, [key]: e.target.value }))
                      }
                      className="field"
                    />
                  </label>
                ))}
              </div>

              {customPreview && custom.name && (
                <div className="rounded-xl bg-[var(--accent-dim)] px-3 py-2.5 text-xs text-[var(--accent)]">
                  <p className="mb-1 font-semibold">
                    Scaled to {custom.amount || 0}
                    {unitLabel(custom.unit)}
                  </p>
                  <p className="text-[var(--foreground)]">
                    {customPreview.calories} kcal · P {customPreview.protein}g ·
                    C {customPreview.carbs}g · F {customPreview.fat}g · Na{" "}
                    {customPreview.sodium}mg
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={queueCustomItem}
                disabled={!custom.name.trim() || Number(custom.amount) <= 0}
                className="btn-primary w-full"
              >
                <Plus className="h-4 w-4" />
                Add to list
              </button>
            </div>
          )}

          {draft.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                  Items to add ({draft.length})
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {Math.round(draftTotals.calories)} kcal · Na{" "}
                  {Math.round(draftTotals.sodium)}mg
                </p>
              </div>
              <ul className="card !space-y-0 divide-y divide-[var(--border-subtle)] !p-0 overflow-hidden">
                {draft.map((item) => (
                  <li
                    key={item.draftId}
                    className="flex items-start gap-2 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {item.name}{" "}
                        <span className="text-[var(--muted)]">
                          · {item.amount}
                          {unitLabel(item.unit)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {item.calories} kcal · P {item.protein}g · C{" "}
                        {item.carbs}g · F {item.fat}g · Na {item.sodium}mg
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeDraft(item.draftId)}
                      className="rounded-lg p-2 text-[var(--muted-2)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border-subtle)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={saveAll}
            disabled={draft.length === 0}
            className="btn-primary w-full"
          >
            <Check className="h-4 w-4" />
            {draft.length === 0
              ? `Add items to ${MEAL_LABELS[mealType]}`
              : `Save ${draft.length} item${draft.length === 1 ? "" : "s"} to ${MEAL_LABELS[mealType]}`}
          </button>
        </div>
      </div>
    </div>
  );
}
