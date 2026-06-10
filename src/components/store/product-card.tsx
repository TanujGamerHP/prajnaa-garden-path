import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/mock/types";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { farmerBySlug } from "@/lib/mock/farmers";

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const toggleWish = useWishlist((s) => s.toggle);
  const saved = useWishlist((s) => s.items.some((i) => i.slug === product.slug));
  const farmer = farmerBySlug(product.farmerSlug);
  return (
    <div className="group flex h-full flex-col transition-transform duration-300 hover:-translate-y-1">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block overflow-hidden rounded-2xl bg-secondary"
      >
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
        {product.badges?.[0] && (
          <span className="font-subhead absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground/80 backdrop-blur">
            {product.badges[0]}
          </span>
        )}
        <button
          type="button"
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const added = await toggleWish({
              slug: product.slug,
              name: product.name,
              image: product.image,
              price: product.price,
              weight: product.weight,
            });
            toast(added ? "Saved to wishlist" : "Removed from wishlist");
          }}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground/80 backdrop-blur transition-colors hover:text-primary"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
        </button>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        {farmer && (
          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {farmer.village}, {farmer.state}
          </p>
        )}
        <Link to="/product/$slug" params={{ slug: product.slug }} className="mt-1">
          <h3 className="font-display text-[17px] font-medium leading-tight">{product.name}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-accent text-accent" />
          <span>{product.rating}</span>
          <span>· {product.weight}</span>
        </div>
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <span className="font-display text-lg font-semibold">{inr(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="ml-2 text-xs text-muted-foreground line-through">{inr(product.mrp)}</span>
            )}
          </div>
          <button
            onClick={() => {
              add({ slug: product.slug, name: product.name, image: product.image, price: product.price, weight: product.weight });
              toast.success(`${product.name} added`);
            }}
            className="font-subhead rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
