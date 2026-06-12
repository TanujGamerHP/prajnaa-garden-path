import { Link } from "@tanstack/react-router";
import type { Farmer } from "@/lib/mock/types";

export function FarmerCard({ farmer }: { farmer: Farmer }) {
  return (
    <Link
      to="/farmer/$slug"
      params={{ slug: farmer.slug }}
      className="group block overflow-hidden rounded-3xl bg-secondary lift"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={farmer.image}
          alt={farmer.name}
          loading="lazy"
          width={800}
          height={1000}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-5 text-white">
          <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-white/80">
            {farmer.village}, {farmer.state}
          </p>
          <h3 className="font-display mt-1 text-2xl font-semibold text-white">{farmer.name}</h3>
          <p className="mt-2 line-clamp-2 max-w-xs text-sm text-white/95">{farmer.storyPreview}</p>
        </div>
      </div>
    </Link>
  );
}
