import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";

function ShellFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
      <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--accent)] animate-pulse">
        paakam
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AppShell />
    </Suspense>
  );
}
