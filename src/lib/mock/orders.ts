import type { Order, Customer } from "./types";

export const orders: Order[] = [
  { id: "PRJ-10241", date: "2026-06-08", customer: "Meera Sharma", items: [{ productSlug: "organic-almonds", qty: 1, price: 1250 }, { productSlug: "turmeric-powder", qty: 2, price: 240 }], total: 1730, status: "shipped", payment: "UPI" },
  { id: "PRJ-10240", date: "2026-06-08", customer: "Arjun Kapoor", items: [{ productSlug: "mango-pickle", qty: 2, price: 380 }], total: 760, status: "packed", payment: "COD" },
  { id: "PRJ-10239", date: "2026-06-07", customer: "Priya Nair", items: [{ productSlug: "garam-masala", qty: 1, price: 320 }, { productSlug: "chai-masala", qty: 1, price: 260 }], total: 580, status: "delivered", payment: "Card" },
  { id: "PRJ-10238", date: "2026-06-07", customer: "Rahul Mehta", items: [{ productSlug: "mixed-seeds", qty: 1, price: 280 }], total: 280, status: "pending", payment: "UPI" },
  { id: "PRJ-10237", date: "2026-06-06", customer: "Anita Das", items: [{ productSlug: "pink-himalayan-salt", qty: 2, price: 180 }], total: 360, status: "delivered", payment: "UPI" },
  { id: "PRJ-10236", date: "2026-06-06", customer: "Vivek Rao", items: [{ productSlug: "organic-almonds", qty: 1, price: 1250 }], total: 1250, status: "delivered", payment: "Card" },
  { id: "PRJ-10235", date: "2026-06-05", customer: "Shreya Pillai", items: [{ productSlug: "lemon-pickle", qty: 1, price: 320 }], total: 320, status: "cancelled", payment: "COD" },
  { id: "PRJ-10234", date: "2026-06-05", customer: "Karan Singh", items: [{ productSlug: "chilli-powder", qty: 3, price: 220 }], total: 660, status: "shipped", payment: "UPI" },
];

export const customers: Customer[] = [
  { id: "c1", name: "Meera Sharma", email: "meera@example.com", phone: "+91 98765 43210", orders: 8, joined: "2025-11-12" },
  { id: "c2", name: "Arjun Kapoor", email: "arjun@example.com", phone: "+91 98123 45678", orders: 3, joined: "2026-02-01" },
  { id: "c3", name: "Priya Nair", email: "priya@example.com", phone: "+91 99887 65432", orders: 12, joined: "2025-08-20" },
  { id: "c4", name: "Rahul Mehta", email: "rahul@example.com", phone: "+91 90011 22334", orders: 2, joined: "2026-04-18" },
  { id: "c5", name: "Anita Das", email: "anita@example.com", phone: "+91 91234 56789", orders: 5, joined: "2026-01-05" },
];
