export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 pt-24 pb-16">
      <div className="h-8 w-32 bg-fg/5 mb-12" />
      <div className="space-y-0 border-t border-fg/10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-fg/10 py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-fg/5" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-fg/5 mb-2" />
              <div className="h-3 w-40 bg-fg/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
