import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`flex flex-col gap-3 ${align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}
    >
      <div className={align === "center" ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        )}
        <h2 className="font-display mt-2 text-3xl font-semibold leading-[1.1] md:text-4xl lg:text-[44px]">
          {title}
        </h2>
        {subtitle && <p className="mt-3 max-w-xl text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className={align === "center" ? "mt-2" : "shrink-0"}>{action}</div>}
    </div>
  );
}
