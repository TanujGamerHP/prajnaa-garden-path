import { Link } from "@tanstack/react-router";
import type { Category } from "@/lib/mock/types";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="group block overflow-hidden rounded-2xl bg-secondary lift"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-medium">{category.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{category.description}</p>
      </div>
    </Link>
  );
}
