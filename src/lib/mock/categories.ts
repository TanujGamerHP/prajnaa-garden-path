import type { Category } from "./types";
import dryfruits from "@/assets/cat-dryfruits.jpg";
import nuts from "@/assets/cat-nuts.jpg";
import seeds from "@/assets/cat-seeds.jpg";
import spices from "@/assets/cat-spices.jpg";
import herbs from "@/assets/cat-herbs.jpg";
import plants from "@/assets/cat-plants.jpg";
import pickles from "@/assets/cat-pickles.jpg";
import salts from "@/assets/cat-salts.jpg";
import masalas from "@/assets/cat-masalas.jpg";

export const categories: Category[] = [
  { slug: "dry-fruits", name: "Dry Fruits", image: dryfruits, description: "Sun-dried, naturally sweet." },
  { slug: "nuts", name: "Nuts", image: nuts, description: "Raw, roasted, hand-sorted." },
  { slug: "seeds", name: "Seeds", image: seeds, description: "Nutrient-dense superfoods." },
  { slug: "spices", name: "Spices", image: spices, description: "Single-origin, freshly ground." },
  { slug: "herbs", name: "Herbs", image: herbs, description: "Aromatic, garden-fresh." },
  { slug: "plants", name: "Plants", image: plants, description: "Live herbs for your home." },
  { slug: "pickles", name: "Pickles", image: pickles, description: "Slow-fermented, family recipes." },
  { slug: "salts", name: "Salts", image: salts, description: "Mineral-rich, unrefined." },
  { slug: "masalas", name: "Masalas", image: masalas, description: "Whole-spice blends." },
];

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
