import type { Product } from "./types";
import almonds from "@/assets/prod-almonds.jpg";
import turmeric from "@/assets/prod-turmeric.jpg";
import pickle from "@/assets/prod-pickle.jpg";
import salt from "@/assets/prod-salt.jpg";
import masala from "@/assets/prod-masala.jpg";
import seeds from "@/assets/prod-seeds.jpg";

export const products: Product[] = [
  {
    slug: "organic-almonds",
    name: "Mamra Almonds",
    category: "dry-fruits",
    farmerSlug: "ramesh-singh",
    image: almonds,
    price: 1250,
    mrp: 1450,
    weight: "500 g",
    stock: 42,
    rating: 4.9,
    reviews: 128,
    description:
      "Heirloom Mamra almonds from glacier-fed orchards in Hunza, Ladakh. Sweeter, oilier, and naturally smaller than commercial varieties. Hand-shelled.",
    badges: ["Natural", "Single Origin"],
    trending: true,
    seasonal: true,
  },
  {
    slug: "turmeric-powder",
    name: "Stone-Ground Turmeric",
    category: "spices",
    farmerSlug: "vikram-rao",
    image: turmeric,
    price: 240,
    mrp: 290,
    weight: "250 g",
    stock: 86,
    rating: 4.8,
    reviews: 211,
    description:
      "Sun-dried Salem turmeric, stone-ground within 48 hours of harvest. High curcumin, no fillers, no anti-caking agents.",
    badges: ["Stone-Ground", "No Additives"],
    trending: true,
  },
  {
    slug: "mango-pickle",
    name: "Heirloom Mango Pickle",
    category: "pickles",
    farmerSlug: "asha-patel",
    image: pickle,
    price: 380,
    weight: "400 g",
    stock: 24,
    rating: 4.9,
    reviews: 96,
    description:
      "Slow-fermented kesar mango pickle, made in small batches with cold-pressed mustard oil and whole spices. Family recipe, 3 generations old.",
    badges: ["Small Batch", "Hand-Made"],
    trending: true,
    seasonal: true,
  },
  {
    slug: "pink-himalayan-salt",
    name: "Pink Himalayan Salt",
    category: "salts",
    farmerSlug: "vikram-rao",
    image: salt,
    price: 180,
    weight: "500 g",
    stock: 120,
    rating: 4.7,
    reviews: 74,
    description:
      "Coarsely milled pink salt from ancient Himalayan deposits. Mineral-rich, unrefined, naturally pink.",
    badges: ["Unrefined"],
  },
  {
    slug: "garam-masala",
    name: "House Garam Masala",
    category: "masalas",
    farmerSlug: "asha-patel",
    image: masala,
    price: 320,
    mrp: 360,
    weight: "200 g",
    stock: 58,
    rating: 4.9,
    reviews: 142,
    description:
      "Whole spices roasted and ground in small batches — cinnamon, cardamom, clove, pepper, nutmeg, mace. No salt, no fillers.",
    badges: ["Small Batch"],
    trending: true,
  },
  {
    slug: "mixed-seeds",
    name: "Five-Seed Mix",
    category: "seeds",
    farmerSlug: "lakshmi-devi",
    image: seeds,
    price: 280,
    weight: "500 g",
    stock: 96,
    rating: 4.6,
    reviews: 58,
    description:
      "Pumpkin, sunflower, flax, sesame, chia — sun-dried and cold-stored. Roast at home for the freshest taste.",
    badges: ["Natural"],
  },
];

// Duplicate variants to fill listings — same product line, different SKU
const variants: Product[] = [
  {
    ...products[0],
    slug: "california-almonds",
    name: "California Almonds",
    price: 720,
    mrp: 850,
    weight: "500 g",
    farmerSlug: "lakshmi-devi",
    trending: false,
    seasonal: false,
    rating: 4.6,
    reviews: 88,
    description:
      "Classic California almonds, sorted and lightly polished. Crisp bite, mild sweetness.",
  },
  {
    ...products[1],
    slug: "chilli-powder",
    name: "Guntur Red Chilli",
    price: 220,
    weight: "250 g",
    farmerSlug: "vikram-rao",
    trending: false,
    rating: 4.7,
    reviews: 102,
    description:
      "Sun-dried Guntur Sannam chillies, stone-ground. Bright red, sharp heat, no colour additives.",
  },
  {
    ...products[2],
    slug: "lemon-pickle",
    name: "Salt-Cured Lemon Pickle",
    price: 320,
    weight: "400 g",
    farmerSlug: "asha-patel",
    trending: false,
    seasonal: false,
    rating: 4.8,
    reviews: 64,
    description:
      "Whole lemons cured with rock salt and sun-aged for six weeks. Bright, sharp, ready to eat.",
  },
  {
    ...products[3],
    slug: "black-salt",
    name: "Black Salt (Kala Namak)",
    price: 160,
    weight: "500 g",
    farmerSlug: "vikram-rao",
    rating: 4.6,
    reviews: 48,
    description:
      "Kiln-fired black salt with a distinctive sulphurous note. Essential for chaats and chutneys.",
  },
  {
    ...products[4],
    slug: "chai-masala",
    name: "Spiced Chai Masala",
    price: 260,
    weight: "150 g",
    farmerSlug: "asha-patel",
    trending: false,
    rating: 4.9,
    reviews: 176,
    description:
      "Cardamom, ginger, clove, cinnamon, pepper — ground for the perfect cup of masala chai.",
  },
  {
    ...products[5],
    slug: "chia-seeds",
    name: "Black Chia Seeds",
    price: 220,
    weight: "250 g",
    farmerSlug: "lakshmi-devi",
    rating: 4.5,
    reviews: 41,
    description:
      "Naturally grown chia seeds, raw and unprocessed. Soak overnight for puddings or smoothies.",
  },
];

export const allProducts: Product[] = [...products, ...variants];

export const productBySlug = (slug: string) => allProducts.find((p) => p.slug === slug);
export const productsByCategory = (slug: string) => allProducts.filter((p) => p.category === slug);
export const productsByFarmer = (slug: string) => allProducts.filter((p) => p.farmerSlug === slug);
export const trendingProducts = () => allProducts.filter((p) => p.trending);
export const seasonalProducts = () => allProducts.filter((p) => p.seasonal);
