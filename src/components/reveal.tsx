import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
  y?: number;
  /** Skip h-full default (e.g. inside hero stats). */
  inline?: boolean;
};

/**
 * Scroll-reveal wrapper.
 *  - Renders content visible by default (no flash on SSR or with JS disabled).
 *  - On mount, hides only off-screen items, then reveals via IntersectionObserver.
 *  - Honors prefers-reduced-motion (no transform/transition).
 *  - Defaults to `h-full` so grid children share a row height — opt out with `inline`.
 */
export function Reveal({
  children,
  delay = 0,
  as = "div",
  className,
  y = 14,
  inline = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Start true → no SSR/hydration flash. We may hide briefly post-mount if off-screen.
  const [state, setState] = useState<"visible" | "pending">("visible");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduceMotion(true);
      setState("visible");
      return;
    }

    // Sync check: if already in viewport at mount, stay visible — never animate above-the-fold.
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
    if (inView) {
      setState("visible");
      return;
    }

    setState("pending");
    if (!("IntersectionObserver" in window)) {
      setState("visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setState("visible");
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";
  const pending = state === "pending" && !reduceMotion;

  return (
    <Tag
      ref={ref as never}
      style={
        reduceMotion
          ? undefined
          : {
              transitionDelay: pending ? "0ms" : `${delay}ms`,
              transform: pending ? `translate3d(0, ${y}px, 0)` : "translate3d(0,0,0)",
              opacity: pending ? 0 : 1,
            }
      }
      className={cn(
        !inline && "h-full",
        !reduceMotion &&
          "transition-[opacity,transform] duration-[650ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[opacity,transform] motion-reduce:transition-none motion-reduce:transform-none",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
