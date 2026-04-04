import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm text-muted font-mono mb-4">Page not found</p>
        <Link href="/" className="text-sm underline underline-offset-4 hover:no-underline">
          Go home
        </Link>
      </div>
    </div>
  );
}
