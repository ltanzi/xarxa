export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 pt-24 pb-16">
      <div className="flex items-center gap-5 mb-8">
        <div className="h-16 w-16 rounded-full bg-fg/5" />
        <div>
          <div className="h-6 w-40 bg-fg/5 mb-2" />
          <div className="h-3 w-24 bg-fg/5" />
        </div>
      </div>
      <div className="h-4 w-full bg-fg/5 mt-6 mb-2" />
      <div className="h-4 w-2/3 bg-fg/5" />
    </div>
  );
}
