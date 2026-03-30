"use client";

export function Footer() {
  return (
    <footer className="py-8 mt-auto">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 border-t border-fg/8 pt-5 flex justify-between text-[10px] uppercase tracking-widest text-muted">
        <span>xarxa</span>
        <span>{new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
