"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2, Save, RefreshCw } from "lucide-react";
import { useHealth } from "@/context/HealthContext";
import { calculateTargets } from "@/lib/nutrition";
import { DEFAULT_SODIUM_LIMIT_MG, HEALTH_CONDITIONS } from "@/types";

export function SettingsView() {
  const { profile, updateProfile, exportData, importData, resetAll } =
    useHealth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [heightCm, setHeightCm] = useState(String(profile.heightCm));
  const [currentWeightKg, setCurrentWeightKg] = useState(
    String(profile.currentWeightKg),
  );
  const [targetWeightKg, setTargetWeightKg] = useState(
    profile.targetWeightKg?.toString() ?? "",
  );
  const [conditions, setConditions] = useState(profile.healthConditions);
  const [targets, setTargets] = useState(profile.targets);
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  function toggleCondition(c: string) {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function recalculate() {
    const next = calculateTargets({
      weightKg: Number(currentWeightKg) || profile.currentWeightKg,
      heightCm: Number(heightCm) || profile.heightCm,
      age: Number(age) || profile.age,
      targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
      healthConditions: conditions,
    });
    setTargets(next);
  }

  function handleSave() {
    updateProfile({
      name: name.trim() || profile.name,
      age: Number(age) || profile.age,
      heightCm: Number(heightCm) || profile.heightCm,
      currentWeightKg: Number(currentWeightKg) || profile.currentWeightKg,
      targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
      healthConditions: conditions,
      targets: {
        ...targets,
        sodiumLimitMg: targets.sodiumLimitMg || DEFAULT_SODIUM_LIMIT_MG,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleImport(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      importData(text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setImportError("Could not import that file. Use a Paakam JSON export.");
    }
  }

  function handleReset() {
    if (
      confirm(
        "Clear all Paakam data? This removes your profile and meal logs from this device.",
      )
    ) {
      resetAll();
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-4 pb-28 animate-rise">
      <div className="pb-1">
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Profile, targets, and local data
        </p>
      </div>

      <section className="card space-y-3">
        <h3 className="section-title">Profile</h3>
        <label className="block">
          <span className="label">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Age</span>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="field"
            />
          </label>
          <label className="block">
            <span className="label">Height (cm)</span>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="field"
            />
          </label>
          <label className="block">
            <span className="label">Weight (kg)</span>
            <input
              type="number"
              step="0.1"
              value={currentWeightKg}
              onChange={(e) => setCurrentWeightKg(e.target.value)}
              className="field"
            />
          </label>
          <label className="block">
            <span className="label">Target (kg)</span>
            <input
              type="number"
              step="0.1"
              value={targetWeightKg}
              onChange={(e) => setTargetWeightKg(e.target.value)}
              className="field"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-3">
        <h3 className="section-title">Health conditions</h3>
        <div className="flex flex-wrap gap-2">
          {HEALTH_CONDITIONS.map((c) => {
            const on = conditions.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCondition(c)}
                className={`chip ${on ? "chip-active" : ""}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">Nutrition targets</h3>
          <button
            type="button"
            onClick={recalculate}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]"
          >
            <RefreshCw className="h-3 w-3" />
            Recalculate
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["calories", "Calories"],
              ["proteinGrams", "Protein (g)"],
              ["carbsGrams", "Carbs (g)"],
              ["fatGrams", "Fat (g)"],
              ["sodiumLimitMg", "Sodium (mg)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="label">{label}</span>
              <input
                type="number"
                value={targets[key]}
                onChange={(e) =>
                  setTargets((t) => ({
                    ...t,
                    [key]: Number(e.target.value) || 0,
                  }))
                }
                className="field"
              />
            </label>
          ))}
        </div>
      </section>

      <button type="button" onClick={handleSave} className="btn-primary w-full">
        <Save className="h-4 w-4" />
        {saved ? "Saved" : "Save changes"}
      </button>

      <section className="card space-y-3">
        <h3 className="section-title">Local data</h3>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          Everything stays on this device. Export a backup before clearing.
        </p>
        <div className="grid gap-2">
          <button
            type="button"
            onClick={exportData}
            className="btn-ghost w-full justify-start"
          >
            <Download className="h-4 w-4 text-[var(--muted)]" />
            Export data as JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-ghost w-full justify-start"
          >
            <Upload className="h-4 w-4 text-[var(--muted)]" />
            Import data from JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = "";
            }}
          />
          {importError && (
            <p className="text-xs text-[var(--danger)]">{importError}</p>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="btn-ghost w-full justify-start text-[var(--danger)] hover:bg-[var(--danger)]/10"
          >
            <Trash2 className="h-4 w-4" />
            Clear / reset database
          </button>
        </div>
      </section>
    </div>
  );
}
