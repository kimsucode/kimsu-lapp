"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/focus", label: "Focus" },
  { href: "/moodboard", label: "Ton moodboard" }
];

function isHidden(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/style-preview");
}

export function BottomNav() {
  const pathname = usePathname();

  if (isHidden(pathname)) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-borderSubtle bg-surface/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto grid w-full max-w-[460px] grid-cols-3 gap-1 rounded-full border border-borderSubtle/80 bg-[#14141b] p-1.5">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={active
                ? "rounded-full border border-lavender/35 bg-lavender/20 px-3 py-2 text-center text-sm font-medium text-lavender shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors duration-300 ease-calm"
                : "rounded-full border border-transparent px-3 py-2 text-center text-sm text-textSecondary transition-colors duration-300 ease-calm hover:text-textPrimary"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
