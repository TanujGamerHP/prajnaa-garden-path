import { Link } from "@tanstack/react-router";
import logoImg from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center ${className}`}>
      <img
        src={logoImg}
        alt="Prajnaa Market"
        className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03] max-w-full"
      />
    </Link>
  );
}
