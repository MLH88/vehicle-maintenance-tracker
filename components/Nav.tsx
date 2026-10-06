"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/history", label: "History" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <span className="font-semibold text-slate-900">Vehicle Maintenance</span>
        <ul className="flex gap-4 text-sm">
          {links.map(({ href, label }) => {
            // Vehicle pages live under the dashboard.
            const active =
              href === "/" ? pathname === "/" || pathname.startsWith("/vehicles") : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    active
                      ? "font-medium text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
