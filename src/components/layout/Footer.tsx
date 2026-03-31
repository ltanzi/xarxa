"use client";

export function Footer() {
  return (
    <footer className="py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="border-rough h-[2px] mb-6" />
        <div className="flex justify-between">
          <span className="text-xs text-muted font-mono">
            <span className="text-red">xarxa</span> &mdash; volunteer service exchange
          </span>
          <span className="text-xs text-muted font-mono">{new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
