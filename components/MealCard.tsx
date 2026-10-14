"use client";

import { useState } from "react";
import {
  ChevronDown,
  Trash2,
  Coffee,
  Sun,
  UtensilsCrossed,
  Moon,
  Cookie,
  Dumbbell,
} from "lucide-react";
import type { MealEntry, MealType } from "@/types";
import { MEAL_LABELS } from "@/types";
import { sumMeal } from "@/lib/nutrition";
import { useHealth } from "@/context/HealthContext";

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  pre_workout: Dumbbell,
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

interface MealCardProps {
  mealType: MealType;
  meal?: MealEntry;
}

export function MealCard({ mealType, meal }: MealCardProps) {
  const { removeFoodItem, removeMeal } = useHealth();
  const [open, setOpen] = useState(Boolean(meal?.items.length));
  const totals = meal ? sumMeal(meal) : null;
  const hasItems = Boolean(meal && meal.items.length > 0);
  const Icon = MEAL_ICONS[mealType];

  return (
    <section className="card overflow-hidden !p-0 transition">
      <button
        type="button"
        onClick={() => hasItems && setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-dim)] text-[var(--accent)]">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight">
              {MEAL_LABELS[mealType]}
            </h3>
            {meal?.time && (
              <span className="text-[11px] text-[var(--muted-2)]">{meal.time}</span>
            )}
            {hasItems && (
              <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                {meal!.items.length}
              </span>
            )}
          </div>
          {totals ? (
            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
              {Math.round(totals.calories)} kcal · P {Math.round(totals.protein)}g ·
              C {Math.round(totals.carbs)}g · Na {Math.round(totals.sodium)}mg
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-[var(--muted-2)]">No items yet</p>
          )}
        </div>
        {hasItems && (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {open && meal && (
        <div className="animate-slide-down border-t border-[var(--border-subtle)] px-4 py-1">
          <ul>
            {meal.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2 border-b border-[var(--border-subtle)] py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
                    {item.weightGrams != null && `${item.weightGrams}g`}
                    {item.weightGrams != null && item.volumeMl != null && " · "}
                    {item.volumeMl != null && `${item.volumeMl}ml`}
                    {(item.weightGrams != null || item.volumeMl != null) && " · "}
                    {Math.round(item.calories)} kcal · P {item.protein}g · C{" "}
                    {item.carbs}g · F {item.fat}g · Na {item.sodium}mg
                  </p>
                  {item.notes && (
                    <p className="mt-1 text-[11px] text-[var(--muted-2)]">
                      {item.notes}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeFoodItem(meal.id, item.id)}
                  className="rounded-lg p-2 text-[var(--muted-2)] transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => removeMeal(meal.id)}
            className="mb-3 mt-1 text-xs font-medium text-[var(--danger)]/80 hover:text-[var(--danger)]"
          >
            Clear meal
          </button>
        </div>
      )}
    </section>
  );
}
