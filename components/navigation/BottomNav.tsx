"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/archive", label: "Archive" },
  { href: "/saved", label: "Saved" }
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
      <div className="mx-auto flex w-full max-w-[460px] items-center justify-between rounded-full border border-borderSubtle/80 bg-[#14141b] px-3 py-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={active
                ? "rounded-full bg-lavender/20 px-4 py-2 text-sm font-medium text-lavender transition-colors duration-300 ease-calm"
                : "rounded-full px-4 py-2 text-sm text-textSecondary transition-colors duration-300 ease-calm hover:text-textPrimary"
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
