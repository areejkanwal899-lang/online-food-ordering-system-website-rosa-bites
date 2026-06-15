import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";

export function Splash() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("rosa-splash-seen")) {
      setShow(false);
      return;
    }
    sessionStorage.setItem("rosa-splash-seen", "1");
    const t = setTimeout(() => setShow(false), 2400);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div className="rosa-splash">
      <div className="flex flex-col items-center">
        <div
          className="grid h-24 w-24 place-items-center rounded-full text-primary-foreground animate-pulse-pink"
          style={{ background: "var(--gradient-primary)" }}
        >
          <UtensilsCrossed className="h-12 w-12 animate-float" />
        </div>
        <h1 className="mt-6 text-4xl font-extrabold text-primary animate-fade-up">Rosa Bites</h1>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary/70 animate-fade-up delay-200">
          Fresh · Fast · Pink
        </p>
      </div>
    </div>
  );
}