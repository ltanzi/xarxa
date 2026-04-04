export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8 pt-24 pb-16">
      <div className="h-8 w-24 bg-fg/5 mb-12" />
      <div className="space-y-0 border-t border-fg/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-fg/10 py-6">
            <div className="h-4 w-2/3 bg-fg/5 mb-3" />
            <div className="h-3 w-1/3 bg-fg/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
