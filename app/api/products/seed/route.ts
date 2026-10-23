import { env } from "cloudflare:workers";
import { getDb } from "../../../../db";
import { products } from "../../../../db/schema";

const starterProducts = [
  { name: "iPhone 15 Pro Max 256GB", category: "Apple", price: 1650000, emoji: "📱", description: "Titanium flagship with pro camera system and excellent battery life." },
  { name: "iPhone 14 128GB", category: "Apple", price: 780000, emoji: "📱", description: "Powerful everyday iPhone with a bright OLED display." },
  { name: "AirPods Pro 2", category: "Apple", price: 210000, emoji: "🎧", description: "Immersive sound with active noise cancellation." },
  { name: "Galaxy S24 Ultra 256GB", category: "Samsung", price: 1350000, emoji: "📱", description: "Premium Galaxy performance, S Pen and versatile cameras." },
  { name: "Galaxy A55 128GB", category: "Samsung", price: 450000, emoji: "📱", description: "Smooth display, capable cameras and dependable battery." },
  { name: "MacBook Air M2 256GB", category: "Laptops", price: 1250000, emoji: "💻", description: "Thin, fast and quiet laptop for work and creativity." },
  { name: "HP EliteBook 840 G8", category: "Laptops", price: 620000, emoji: "💻", description: "Reliable business laptop with premium build quality." },
  { name: "PlayStation 5 Console", category: "Gaming", price: 850000, emoji: "🎮", description: "Next-generation console gaming with ultra-fast loading." },
];

export async function POST(request: Request) {
  if (!env.ADMIN_KEY || request.headers.get("x-admin-key") !== env.ADMIN_KEY) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const existing = await db.select().from(products).limit(1);
  if (existing.length) return Response.json({ seeded: false, reason: "Catalog already contains products" });
  await db.insert(products).values(starterProducts.map((p) => ({ ...p, description: p.description, inStock: true })));
  return Response.json({ seeded: true, count: starterProducts.length });
}
