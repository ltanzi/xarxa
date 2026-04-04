export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8 pt-24 pb-16">
      <div className="h-8 w-32 bg-fg/5 mb-12" />
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 bg-fg/5 mb-4" />
            <div className="border-t border-fg/10 pt-4">
              <div className="h-4 w-1/2 bg-fg/5 mb-2" />
              <div className="h-3 w-1/4 bg-fg/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
