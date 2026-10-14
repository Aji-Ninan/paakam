"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldAlert } from "lucide-react";
import { useHealth } from "@/context/HealthContext";
import { calculateTargets } from "@/lib/nutrition";
import {
  DEFAULT_SODIUM_LIMIT_MG,
  HEALTH_CONDITIONS,
  type UserProfile,
} from "@/types";

export function OnboardingModal() {
  const { completeOnboarding } = useHealth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("30");
  const [heightCm, setHeightCm] = useState("170");
  const [currentWeightKg, setCurrentWeightKg] = useState("70");
  const [targetWeightKg, setTargetWeightKg] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [targetsTouched, setTargetsTouched] = useState(false);

  const autoTargets = useMemo(
    () =>
      calculateTargets({
        weightKg: Number(currentWeightKg) || 70,
        heightCm: Number(heightCm) || 170,
        age: Number(age) || 30,
        targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
        healthConditions: conditions,
      }),
    [age, heightCm, currentWeightKg, targetWeightKg, conditions],
  );

  const [manualTargets, setManualTargets] = useState(autoTargets);
  const targets = targetsTouched ? manualTargets : autoTargets;

  function toggleCondition(c: string) {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
    setTargetsTouched(false);
  }

  function updateTarget(key: keyof typeof autoTargets, value: string) {
    setTargetsTouched(true);
    setManualTargets((prev) => {
      const base = targetsTouched ? prev : autoTargets;
      return { ...base, [key]: Number(value) || 0 };
    });
  }

  function canNext(): boolean {
    if (step === 0) {
      return (
        name.trim().length > 0 &&
        Number(age) > 0 &&
        Number(heightCm) > 0 &&
        Number(currentWeightKg) > 0
      );
    }
    return true;
  }

  function finish() {
    const profile: UserProfile = {
      name: name.trim(),
      age: Number(age),
      heightCm: Number(heightCm),
      currentWeightKg: Number(currentWeightKg),
      targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
      healthConditions: conditions,
      targets: {
        ...targets,
        sodiumLimitMg: targets.sodiumLimitMg || DEFAULT_SODIUM_LIMIT_MG,
      },
      onboardingCompleted: true,
    };
    completeOnboarding(profile);
  }

  const showSodiumVital =
    conditions.includes("Hypertension") || conditions.includes("Renal Health");

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--background)] sm:items-center">
      <div className="flex h-full w-full max-w-lg flex-col sm:h-auto sm:max-h-[92dvh] sm:overflow-hidden sm:rounded-3xl sm:border sm:border-[var(--border-subtle)] sm:shadow-2xl">
        <div className="border-b border-[var(--border-subtle)] px-5 pb-4 pt-[max(1.35rem,env(safe-area-inset-top))]">
          <p className="brand text-3xl leading-none">paakam</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Set up your daily nutrition & health guardrails
          </p>
          <div className="mt-5 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i <= step ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 0 && (
            <div className="animate-rise space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Physical metrics
              </h2>
              <label className="block">
                <span className="label">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field"
                  placeholder="Your name"
                  autoFocus
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label">Age</span>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      setTargetsTouched(false);
                    }}
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="label">Height (cm)</span>
                  <input
                    type="number"
                    min={100}
                    max={250}
                    value={heightCm}
                    onChange={(e) => {
                      setHeightCm(e.target.value);
                      setTargetsTouched(false);
                    }}
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="label">Current weight (kg)</span>
                  <input
                    type="number"
                    min={30}
                    step="0.1"
                    value={currentWeightKg}
                    onChange={(e) => {
                      setCurrentWeightKg(e.target.value);
                      setTargetsTouched(false);
                    }}
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="label">Target weight (kg)</span>
                  <input
                    type="number"
                    min={30}
                    step="0.1"
                    value={targetWeightKg}
                    onChange={(e) => {
                      setTargetWeightKg(e.target.value);
                      setTargetsTouched(false);
                    }}
                    className="field"
                    placeholder="Optional"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-rise space-y-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Health profiles
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Select any that apply — these shape sodium and macros.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {HEALTH_CONDITIONS.map((c) => {
                  const checked = conditions.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCondition(c)}
                      className={`chip ${checked ? "chip-active" : ""}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-rise space-y-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Your daily targets
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Auto-calculated for metabolic stability
                  {conditions.includes("Insulin Resistance")
                    ? " with insulin-resistance-friendly macros"
                    : ""}
                  . Fine-tune before finishing.
                </p>
              </div>

              <div
                className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                  showSodiumVital
                    ? "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]"
                    : "border-[var(--safe)]/25 bg-[var(--safe)]/10 text-[var(--safe)]"
                }`}
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Sodium ceiling set to{" "}
                  <strong>{DEFAULT_SODIUM_LIMIT_MG} mg/day</strong>
                  {showSodiumVital
                    ? " — vital for Hypertension & Renal Health."
                    : " — recommended daily limit."}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["calories", "Calories"],
                    ["proteinGrams", "Protein (g)"],
                    ["carbsGrams", "Carbs (g)"],
                    ["fatGrams", "Fat (g)"],
                    ["sodiumLimitMg", "Sodium limit (mg)"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="label">{label}</span>
                    <input
                      type="number"
                      min={0}
                      value={targets[key] ?? ""}
                      onChange={(e) => updateTarget(key, e.target.value)}
                      className="field"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-[var(--border-subtle)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-ghost"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}
          <div className="flex-1" />
          {step < 2 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="btn-primary"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={finish} className="btn-primary">
              <Check className="h-4 w-4" />
              Start tracking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
