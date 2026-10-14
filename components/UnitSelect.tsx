"use client";

import {
  UNIT_DEFINITIONS,
  type FoodUnit,
  type UnitDefinition,
} from "@/lib/foodCatalog";

interface UnitSelectProps {
  value: FoodUnit;
  options?: FoodUnit[];
  onChange: (unit: FoodUnit) => void;
  id?: string;
}

export function UnitSelect({
  value,
  options,
  onChange,
  id,
}: UnitSelectProps) {
  const defs: UnitDefinition[] = options
    ? UNIT_DEFINITIONS.filter((u) => options.includes(u.id))
    : UNIT_DEFINITIONS;

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as FoodUnit)}
      className="field min-w-[9.5rem] cursor-pointer appearance-none pr-9"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b9a90' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.75rem center",
      }}
    >
      {defs.map((u) => (
        <option key={u.id} value={u.id}>
          {u.label}
        </option>
      ))}
    </select>
  );
}
