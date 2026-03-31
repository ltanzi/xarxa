"use client";

export function Footer() {
  return (
    <footer className="py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 border-t border-fg/10 pt-6 flex justify-between items-center">
        <span className="text-xs text-muted font-mono">
          <span className="font-display text-sm text-fg">xarxa</span> <span className="doodle-star" /> volunteer service exchange
        </span>
        <span className="text-xs text-muted font-mono">{new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
