"use client";

import { useState } from "react";
import { useHealth } from "@/context/HealthContext";
import { MEAL_ORDER } from "@/types";
import { OnboardingModal } from "./OnboardingModal";
import { DashboardHeader } from "./DashboardHeader";
import { MealCard } from "./MealCard";
import { AddFoodModal } from "./AddFoodModal";
import { BottomNav } from "./BottomNav";
import { SettingsView } from "./SettingsView";

export function AppShell() {
  const { ready, profile, currentLog, activeTab } = useHealth();
  const [addOpen, setAddOpen] = useState(false);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <p className="brand text-3xl animate-pulse">paakam</p>
      </div>
    );
  }

  if (!profile.onboardingCompleted) {
    return <OnboardingModal />;
  }

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      {activeTab === "today" ? (
        <>
          <DashboardHeader />
          <main className="mx-auto max-w-lg space-y-3 px-4 py-5 pb-28">
            <h2 className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
              Meals
            </h2>
            {MEAL_ORDER.map((type, i) => (
              <div
                key={type}
                className="animate-rise"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <MealCard
                  mealType={type}
                  meal={currentLog.meals.find((m) => m.mealType === type)}
                />
              </div>
            ))}
          </main>
        </>
      ) : (
        <main className="pt-[max(0.85rem,env(safe-area-inset-top))]">
          <div className="mx-auto max-w-lg px-4 pt-1">
            <p className="brand text-lg leading-none">paakam</p>
          </div>
          <SettingsView
            key={profile.name + String(profile.onboardingCompleted)}
          />
        </main>
      )}

      <BottomNav onAdd={() => setAddOpen(true)} />
      <AddFoodModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
