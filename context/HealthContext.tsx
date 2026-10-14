"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppExportData,
  DailyLog,
  FoodItem,
  MealEntry,
  MealType,
  UserProfile,
} from "@/types";
import { defaultProfile, sumDailyLog, type MacroTotals } from "@/lib/nutrition";
import {
  clearAllData,
  downloadJson,
  exportAllData,
  loadLogs,
  loadProfile,
  parseImportData,
  saveLogs,
  saveProfile,
} from "@/lib/storage";
import { currentTimeHHMM, generateId, todayISO } from "@/lib/utils";

type TabId = "today" | "settings";

interface HealthContextValue {
  ready: boolean;
  profile: UserProfile;
  logs: DailyLog[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  currentLog: DailyLog;
  dailyTotals: MacroTotals;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  addFoodToMeal: (mealType: MealType, item: Omit<FoodItem, "id">) => void;
  addFoodsToMeal: (mealType: MealType, items: Omit<FoodItem, "id">[]) => void;
  removeFoodItem: (mealId: string, itemId: string) => void;
  removeMeal: (mealId: string) => void;
  exportData: () => void;
  importData: (json: string) => void;
  resetAll: () => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

function ensureLog(logs: DailyLog[], date: string): DailyLog {
  return logs.find((l) => l.date === date) ?? { date, meals: [] };
}

function upsertLog(logs: DailyLog[], log: DailyLog): DailyLog[] {
  const idx = logs.findIndex((l) => l.date === log.date);
  if (idx === -1) return [...logs, log].sort((a, b) => a.date.localeCompare(b.date));
  const next = [...logs];
  next[idx] = log;
  return next;
}

export function HealthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("today");

  useEffect(() => {
    setProfile(loadProfile());
    setLogs(loadLogs());
    setSelectedDate(todayISO());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveProfile(profile);
  }, [profile, ready]);

  useEffect(() => {
    if (!ready) return;
    saveLogs(logs);
  }, [logs, ready]);

  const currentLog = useMemo(
    () => ensureLog(logs, selectedDate),
    [logs, selectedDate],
  );

  const dailyTotals = useMemo(() => sumDailyLog(currentLog), [currentLog]);

  const completeOnboarding = useCallback((next: UserProfile) => {
    setProfile({ ...next, onboardingCompleted: true });
  }, []);

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...partial,
      targets: partial.targets
        ? { ...prev.targets, ...partial.targets }
        : prev.targets,
    }));
  }, []);

  const addFoodsToMeal = useCallback(
    (mealType: MealType, items: Omit<FoodItem, "id">[]) => {
      if (items.length === 0) return;
      const foods: FoodItem[] = items.map((item) => ({
        ...item,
        id: generateId(),
      }));
      setLogs((prev) => {
        const log = ensureLog(prev, selectedDate);
        const existing = log.meals.find((m) => m.mealType === mealType);
        let meals: MealEntry[];
        if (existing) {
          meals = log.meals.map((m) =>
            m.id === existing.id
              ? { ...m, items: [...m.items, ...foods] }
              : m,
          );
        } else {
          meals = [
            ...log.meals,
            {
              id: generateId(),
              mealType,
              time: currentTimeHHMM(),
              items: foods,
            },
          ];
        }
        return upsertLog(prev, { ...log, meals });
      });
    },
    [selectedDate],
  );

  const addFoodToMeal = useCallback(
    (mealType: MealType, item: Omit<FoodItem, "id">) => {
      addFoodsToMeal(mealType, [item]);
    },
    [addFoodsToMeal],
  );

  const removeFoodItem = useCallback(
    (mealId: string, itemId: string) => {
      setLogs((prev) => {
        const log = ensureLog(prev, selectedDate);
        const meals = log.meals
          .map((m) =>
            m.id === mealId
              ? { ...m, items: m.items.filter((i) => i.id !== itemId) }
              : m,
          )
          .filter((m) => m.items.length > 0);
        return upsertLog(prev, { ...log, meals });
      });
    },
    [selectedDate],
  );

  const removeMeal = useCallback(
    (mealId: string) => {
      setLogs((prev) => {
        const log = ensureLog(prev, selectedDate);
        return upsertLog(prev, {
          ...log,
          meals: log.meals.filter((m) => m.id !== mealId),
        });
      });
    },
    [selectedDate],
  );

  const exportData = useCallback(() => {
    const data: AppExportData = exportAllData(profile, logs);
    downloadJson(`paakam-export-${todayISO()}.json`, data);
  }, [profile, logs]);

  const importData = useCallback((json: string) => {
    const { profile: p, logs: l } = parseImportData(json);
    setProfile(p);
    setLogs(l);
  }, []);

  const resetAll = useCallback(() => {
    clearAllData();
    setProfile(defaultProfile());
    setLogs([]);
    setSelectedDate(todayISO());
    setActiveTab("today");
  }, []);

  const value = useMemo<HealthContextValue>(
    () => ({
      ready,
      profile,
      logs,
      selectedDate,
      setSelectedDate,
      activeTab,
      setActiveTab,
      currentLog,
      dailyTotals,
      completeOnboarding,
      updateProfile,
      addFoodToMeal,
      addFoodsToMeal,
      removeFoodItem,
      removeMeal,
      exportData,
      importData,
      resetAll,
    }),
    [
      ready,
      profile,
      logs,
      selectedDate,
      activeTab,
      currentLog,
      dailyTotals,
      completeOnboarding,
      updateProfile,
      addFoodToMeal,
      addFoodsToMeal,
      removeFoodItem,
      removeMeal,
      exportData,
      importData,
      resetAll,
    ],
  );

  return (
    <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
  );
}

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth must be used within HealthProvider");
  return ctx;
}
