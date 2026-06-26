"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/hook";

// Renders a small "Email verified" toast when ?verified=1 is in the URL.
// One-shot: a ref guards against React StrictMode double-invocation and
// against re-fire after the URL is cleaned. Uses window.history.replaceState
// directly because router.replace can be a no-op when target === current path.
export default function VerifiedToast() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") !== "1") return;
    fired.current = true;

    setShow(true);

    // Clean the URL so a refresh doesn't re-fire (and so the param
    // doesn't leak via Referer to outbound links).
    params.delete("verified");
    const newQs = params.toString();
    const newUrl =
      window.location.pathname + (newQs ? `?${newQs}` : "") + window.location.hash;
    window.history.replaceState(window.history.state, "", newUrl);

    const id = window.setTimeout(() => setShow(false), 4000);
    return () => window.clearTimeout(id);
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-fg text-bg px-5 py-2.5 text-sm font-mono uppercase tracking-wider"
    >
      {t("verification.verifiedToast")}
    </div>
  );
}
