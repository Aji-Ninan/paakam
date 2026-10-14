"use client";

import { FOOD_CATALOG, type CatalogFood } from "@/lib/foodCatalog";

interface PantryPresetsProps {
  selectedId?: string;
  onSelect: (food: CatalogFood) => void;
}

export function PantryPresets({ selectedId, onSelect }: PantryPresetsProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
        Staples / pantry
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {FOOD_CATALOG.map((food) => {
          const active = selectedId === food.id;
          return (
            <button
              key={food.id}
              type="button"
              onClick={() => onSelect(food)}
              className={`chip shrink-0 ${active ? "chip-active" : ""}`}
            >
              {food.chipLabel ?? food.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
