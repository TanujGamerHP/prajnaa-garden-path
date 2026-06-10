export type Category = {
  slug: string;
  name: string;
  image: string;
  description: string;
};

export type Farmer = {
  slug: string;
  name: string;
  image: string;
  village: string;
  state: string;
  region: string;
  yearsExperience: number;
  method: string;
  storyPreview: string;
  story: string;
  upcomingHarvests: string[];
  productSlugs: string[];
};

export type Product = {
  slug: string;
  name: string;
  category: string;          // category slug
  farmerSlug: string;
  image: string;
  images?: string[];
  price: number;             // INR
  mrp?: number;
  weight: string;
  stock: number;
  rating: number;
  reviews: number;
  description: string;
  badges?: string[];
  trending?: boolean;
  seasonal?: boolean;
};

export type Order = {
  id: string;
  date: string;
  customer: string;
  items: { productSlug: string; qty: number; price: number }[];
  total: number;
  status: "pending" | "packed" | "shipped" | "delivered" | "cancelled";
  payment: "COD" | "UPI" | "Card";
};

export type Review = {
  id: string;
  author: string;
  location: string;
  rating: number;
  text: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  joined: string;
};
