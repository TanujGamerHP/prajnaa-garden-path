import { Link } from "@tanstack/react-router";
import type { Category } from "@/lib/mock/types";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      to="/shop"
      search={{ cat: category.slug }}
      className="group block text-center"
    >
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary/80 overflow-hidden border border-border/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.15)] bg-background">
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          width={120}
          height={120}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
      </div>
      <h3 className="font-display mt-3.5 text-xs font-semibold text-foreground/85 transition-colors group-hover:text-primary tracking-tight">
        {category.name}
      </h3>
    </Link>
  );
}
