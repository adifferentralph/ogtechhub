import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";

function isAdmin(request: Request) {
  return Boolean(env.ADMIN_KEY) && request.headers.get("x-admin-key") === env.ADMIN_KEY;
}
function cleanProduct(row: typeof products.$inferSelect) {
  return { ...row, imageUrl: row.imageKey ? `/api/images/${encodeURIComponent(row.imageKey.replace(/^products\//, ""))}` : null };
}
function number(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export async function GET() {
  try {
    const rows = await getDb().select().from(products).orderBy(desc(products.createdAt), desc(products.id));
    return Response.json({ products: rows.map(cleanProduct) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load products" }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  return new Response(null, { status: isAdmin(request) ? 204 : 401 });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Incorrect admin password" }, { status: 401 });
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const category = String(form.get("category") || "").trim();
  const description = String(form.get("description") || "").trim();
  const price = number(form.get("price"));
  const emoji = String(form.get("emoji") || "📱").trim().slice(0, 8) || "📱";
  if (!name || !category || price <= 0) return Response.json({ error: "Name, category and a valid price are required" }, { status: 400 });
  let imageKey: string | null = null;
  const image = form.get("image");
  if (image instanceof File && image.size) {
    if (!image.type.startsWith("image/") || image.size > 6_000_000) return Response.json({ error: "Use an image under 6MB" }, { status: 400 });
    const extension = image.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    imageKey = `products/${crypto.randomUUID()}.${extension}`;
    await env.BUCKET.put(imageKey, image.stream(), { httpMetadata: { contentType: image.type } });
  }
  const [product] = await getDb().insert(products).values({ name, category, description, price, imageKey, emoji, inStock: true }).returning();
  return Response.json({ product: cleanProduct(product) }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Incorrect admin password" }, { status: 401 });
  const body = await request.json() as { id?: number; name?: string; category?: string; description?: string; price?: number; inStock?: boolean };
  if (!body.id) return Response.json({ error: "Product id is required" }, { status: 400 });
  const values: Partial<typeof products.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) values.name = body.name.trim();
  if (typeof body.category === "string" && body.category.trim()) values.category = body.category.trim();
  if (typeof body.description === "string") values.description = body.description.trim();
  if (typeof body.price === "number" && body.price > 0) values.price = Math.round(body.price);
  if (typeof body.inStock === "boolean") values.inStock = body.inStock;
  const [product] = await getDb().update(products).set(values).where(eq(products.id, body.id)).returning();
  return product ? Response.json({ product: cleanProduct(product) }) : Response.json({ error: "Product not found" }, { status: 404 });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Incorrect admin password" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return Response.json({ error: "Product id is required" }, { status: 400 });
  const [existing] = await getDb().select().from(products).where(eq(products.id, id)).limit(1);
  if (existing?.imageKey) await env.BUCKET.delete(existing.imageKey);
  await getDb().delete(products).where(eq(products.id, id));
  return Response.json({ ok: true });
}
