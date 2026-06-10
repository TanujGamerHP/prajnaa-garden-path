import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-[8deg]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2c3 4 4 7 4 10a4 4 0 0 1-8 0c0-3 1-6 4-10Z" />
          <path d="M12 14v8" />
          <path d="M9 22h6" />
        </svg>
      </span>
      <span className="font-display text-[18px] font-semibold leading-none tracking-tight">
        Prajnaa <span className="text-primary">Farm</span>
      </span>
    </Link>
  );
}
