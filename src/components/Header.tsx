'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fetchHealth } from "@/lib/api";

export function Header() {
  const pathname = usePathname();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((h) => setVersion(h.version))
      .catch(() => setVersion(null));
  }, []);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-hairline bg-canvas px-4">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-on-dark">
            M
          </div>
          <div className="leading-tight">
            <h1 className="text-title-sm text-ink">MigraineAAT-KG</h1>
            <p className="text-caption text-muted">Assertion-aware temporal migraine KG</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-6 text-nav-link">
            <Link
              href="/"
              className={cn(
                'transition-colors hover:text-ink',
                pathname === '/' ? 'text-ink' : 'text-body'
              )}
            >
              QA
            </Link>
            <Link
              href="/benchmark"
              className={cn(
                'transition-colors hover:text-ink',
                pathname === '/benchmark' ? 'text-ink' : 'text-body'
              )}
            >
              Benchmark
            </Link>
            <Link
              href="/graph"
              className={cn(
                'transition-colors hover:text-ink',
                pathname === '/graph' ? 'text-ink' : 'text-body'
              )}
            >
              Graph
            </Link>
            <Link
              href="/ablations"
              className={cn(
                'transition-colors hover:text-ink',
                pathname === '/ablations' ? 'text-ink' : 'text-body'
              )}
            >
              Ablations
            </Link>
            <Link
              href="/about"
              className={cn(
                'transition-colors hover:text-ink',
                pathname === '/about' ? 'text-ink' : 'text-body'
              )}
            >
              About
            </Link>
          </nav>
          {version && (
            <span
              className="hidden text-caption text-muted-soft sm:inline"
              title={`API version ${version}`}
            >
              v{version}
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}