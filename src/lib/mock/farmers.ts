import type { Farmer } from "./types";
import f1 from "@/assets/farmer-1.jpg";
import f2 from "@/assets/farmer-2.jpg";
import f3 from "@/assets/farmer-3.jpg";
import f4 from "@/assets/farmer-4.jpg";

export const farmers: Farmer[] = [
  {
    slug: "lakshmi-devi",
    name: "Lakshmi Devi",
    image: f1,
    village: "Anantapur",
    state: "Andhra Pradesh",
    region: "Rayalaseema",
    yearsExperience: 22,
    method: "Natural farming · Zero pesticide",
    storyPreview: "Three generations of growing groundnut and millet without a drop of chemical.",
    story: "Lakshmi inherited 4 acres from her father in 1998 and turned away from the chemical inputs the village had adopted. Today her farm is a benchmark for natural cultivation in Rayalaseema, supplying co-operatives and now, directly, families across India.",
    upcomingHarvests: ["Groundnut · Nov 2026", "Foxtail millet · Dec 2026"],
    productSlugs: ["organic-almonds", "mixed-seeds"],
  },
  {
    slug: "ramesh-singh",
    name: "Ramesh Singh",
    image: f2,
    village: "Hunza",
    state: "Ladakh",
    region: "Hunza Valley",
    yearsExperience: 35,
    method: "Heirloom orchards · Glacier-fed",
    storyPreview: "Almond and apricot orchards tended the same way his grandfather did, fed by glacier streams.",
    story: "At 12,000 feet, Ramesh's orchards yield slowly but with exceptional flavour. Every almond is hand-shelled by women's collectives in the village — a livelihood the family has protected for over three decades.",
    upcomingHarvests: ["Mamra almond · Aug 2026", "Wild apricot · Sep 2026"],
    productSlugs: ["organic-almonds"],
  },
  {
    slug: "asha-patel",
    name: "Asha Patel",
    image: f3,
    village: "Anand",
    state: "Gujarat",
    region: "Charotar",
    yearsExperience: 9,
    method: "Permaculture · Companion planting",
    storyPreview: "A first-generation farmer growing kitchen herbs and traditional pickle ingredients.",
    story: "Asha left her city job to set up a 2-acre permaculture farm in 2017. She now grows over forty culinary herbs and runs a small pickle kitchen with five women from the village.",
    upcomingHarvests: ["Holy basil · Year-round", "Mango (kesar) · May 2026"],
    productSlugs: ["mango-pickle", "garam-masala"],
  },
  {
    slug: "vikram-rao",
    name: "Vikram Rao",
    image: f4,
    village: "Khammam",
    state: "Telangana",
    region: "Godavari belt",
    yearsExperience: 18,
    method: "Sun-dried · Stone-ground",
    storyPreview: "Spices grown, dried, and ground on-farm — never warehoused or fumigated.",
    story: "Vikram's farm is also a small mill. Chillies, turmeric, and coriander are dried on raised cots and stone-ground within 48 hours of harvest — what arrives at your door is what left his field that week.",
    upcomingHarvests: ["Guntur chilli · Jan 2027", "Turmeric · Feb 2027"],
    productSlugs: ["turmeric-powder", "garam-masala", "pink-himalayan-salt"],
  },
];

export const farmerBySlug = (slug: string) => farmers.find((f) => f.slug === slug);
