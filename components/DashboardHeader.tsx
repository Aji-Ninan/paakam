"use client";

import { ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { useHealth } from "@/context/HealthContext";
import { progressRatio, sodiumLevel } from "@/lib/nutrition";
import { formatDisplayDate, shiftDate, todayISO } from "@/lib/utils";

function ProgressRow({
  label,
  current,
  target,
  unit,
  accent,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  accent: string;
}) {
  const ratio = progressRatio(current, target);
  const pct = Math.min(ratio * 100, 100);
  const over = current > target;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
        <span
          className={`text-xs tabular-nums ${
            over ? "font-semibold text-[var(--danger)]" : "text-[var(--foreground)]"
          }`}
        >
          <span className="font-semibold">{Math.round(current)}</span>
          <span className="text-[var(--muted-2)]">
            {" "}
            / {target}
            {unit}
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: over ? "var(--danger)" : accent,
          }}
        />
      </div>
    </div>
  );
}

export function DashboardHeader() {
  const { profile, selectedDate, setSelectedDate, dailyTotals } = useHealth();
  const limit = profile.targets.sodiumLimitMg;
  const level = sodiumLevel(dailyTotals.sodium, limit);
  const isToday = selectedDate === todayISO();

  const sodiumStyles =
    level === "danger"
      ? "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]"
      : level === "caution"
        ? "border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]"
        : "border-[var(--safe)]/25 bg-[var(--safe)]/10 text-[var(--safe)]";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--background)]/85 backdrop-blur-xl">
      <div className="mx-auto max-w-lg px-4 pb-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="brand text-xl leading-none">paakam</p>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">
              {profile.name ? `Hi, ${profile.name}` : "Daily nutrition"}
            </p>
          </div>

          <div className="flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              className="rounded-full p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[5.75rem] text-center text-sm font-semibold tracking-tight">
              {formatDisplayDate(selectedDate)}
            </span>
            <button
              type="button"
              aria-label="Next day"
              disabled={isToday}
              onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
              className="rounded-full p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-25"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="card space-y-3.5 animate-rise">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            <ProgressRow
              label="Calories"
              current={dailyTotals.calories}
              target={profile.targets.calories}
              unit=" kcal"
              accent="var(--accent)"
            />
            <ProgressRow
              label="Protein"
              current={dailyTotals.protein}
              target={profile.targets.proteinGrams}
              unit="g"
              accent="var(--protein)"
            />
            <ProgressRow
              label="Carbs"
              current={dailyTotals.carbs}
              target={profile.targets.carbsGrams}
              unit="g"
              accent="var(--carbs)"
            />
            <ProgressRow
              label="Sodium"
              current={dailyTotals.sodium}
              target={limit}
              unit=" mg"
              accent={
                level === "danger"
                  ? "var(--danger)"
                  : level === "caution"
                    ? "var(--warning)"
                    : "var(--safe)"
              }
            />
          </div>

          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${sodiumStyles}`}
          >
            {level === "danger" ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>
              Sodium {Math.round(dailyTotals.sodium)} / {limit} mg
              {level === "danger"
                ? " — ceiling exceeded"
                : level === "caution"
                  ? " — approaching limit"
                  : " — within safe range"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
