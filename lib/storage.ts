import type { AppExportData, DailyLog, UserProfile } from "@/types";
import { STORAGE_KEYS } from "@/types";
import { defaultProfile } from "./nutrition";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadProfile(): UserProfile {
  if (!canUseStorage()) return defaultProfile();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.profile);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return { ...defaultProfile(), ...parsed, targets: {
      ...defaultProfile().targets,
      ...(parsed.targets ?? {}),
    }};
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: UserProfile): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export function loadLogs(): DailyLog[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.logs);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLogs(logs: DailyLog[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
}

export function clearAllData(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEYS.profile);
  localStorage.removeItem(STORAGE_KEYS.logs);
}

export function exportAllData(
  profile: UserProfile,
  logs: DailyLog[],
): AppExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    logs,
  };
}

export function parseImportData(json: string): {
  profile: UserProfile;
  logs: DailyLog[];
} {
  const data = JSON.parse(json) as AppExportData | UserProfile;
  if ("profile" in data && "logs" in data) {
    return {
      profile: { ...defaultProfile(), ...data.profile },
      logs: Array.isArray(data.logs) ? data.logs : [],
    };
  }
  throw new Error("Unrecognized Paakam export format");
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
