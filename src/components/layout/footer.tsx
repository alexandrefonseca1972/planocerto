import { APP_VERSION } from "@/lib/version";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="text-center text-xs text-zinc-400 dark:text-zinc-500">
        &copy; {new Date().getFullYear()} PlanoCerto · powered by Ruphus · v{APP_VERSION}
      </div>
    </footer>
  );
}
