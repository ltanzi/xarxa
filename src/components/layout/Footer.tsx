"use client";

export function Footer() {
  return (
    <footer className="py-10 px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px] border-t border-fg/8 pt-8 flex justify-between items-center">
        <span className="font-display italic text-muted text-sm">xarxa</span>
        <span className="font-label text-muted">{new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
