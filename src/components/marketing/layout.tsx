import type { ReactNode } from "react";
import { MarketingHeader } from "./header";
import { MarketingFooter } from "./footer";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
