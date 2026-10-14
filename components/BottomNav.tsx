"use client";

import { Home, Plus, Settings } from "lucide-react";
import { useHealth } from "@/context/HealthContext";

interface BottomNavProps {
  onAdd: () => void;
}

export function BottomNav({ onAdd }: BottomNavProps) {
  const { activeTab, setActiveTab } = useHealth();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--background)]/92 backdrop-blur-xl">
      <div className="mx-auto grid max-w-lg grid-cols-3 items-end px-6 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition ${
            activeTab === "today" ? "text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          <Home
            className="h-5 w-5"
            strokeWidth={activeTab === "today" ? 2.25 : 1.75}
          />
          Today
        </button>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add food"
            className="-mt-6 flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_8px_24px_rgba(165,214,167,0.35)] transition active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition ${
            activeTab === "settings"
              ? "text-[var(--accent)]"
              : "text-[var(--muted)]"
          }`}
        >
          <Settings
            className="h-5 w-5"
            strokeWidth={activeTab === "settings" ? 2.25 : 1.75}
          />
          Settings
        </button>
      </div>
    </nav>
  );
}
