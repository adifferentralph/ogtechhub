import { env } from "cloudflare:workers";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { productImages, products } from "../../../db/schema";

function isAdmin(request: Request) {
  return Boolean(env.ADMIN_KEY) && request.headers.get("x-admin-key") === env.ADMIN_KEY;
}

function imageUrl(key: string) {
  return `/api/images/${encodeURIComponent(key.replace(/^products\//, ""))}`;
}

function cleanProduct(row: typeof products.$inferSelect, keys: string[] = []) {
  const allKeys = keys.length ? keys : row.imageKey ? [row.imageKey] : [];
  const images = allKeys.map(imageUrl);
  return { ...row, images, imageUrl: images[0] ?? null };
}

function number(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(products).orderBy(desc(products.createdAt), desc(products.id));
    const ids = rows.map((row) => row.id);
    const imageRows = ids.length
      ? await db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder))
      : [];
    const byProduct = new Map<number, string[]>();
    for (const image of imageRows) byProduct.set(image.productId, [...(byProduct.get(image.productId) ?? []), image.imageKey]);
    return Response.json({ products: rows.map((row) => cleanProduct(row, byProduct.get(row.id))) });
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
  const oldPrice = number(form.get("oldPrice")) || null;
  const stock = Math.max(0, number(form.get("stock")));
  const condition = String(form.get("condition") || "Brand new").trim();
  const emoji = String(form.get("emoji") || "📱").trim().slice(0, 8) || "📱";
  if (!name || !category || price <= 0) return Response.json({ error: "Name, category and a valid price are required" }, { status: 400 });

  const images = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  if (images.length < 1 || images.length > 4) return Response.json({ error: "Upload between 1 and 4 product images" }, { status: 400 });
  if (images.some((image) => !image.type.startsWith("image/") || image.size > 6_000_000)) {
    return Response.json({ error: "Each file must be an image under 6MB" }, { status: 400 });
  }

  const uploaded: string[] = [];
  try {
    for (const image of images) {
      const extension = image.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
      const key = `products/${crypto.randomUUID()}.${extension}`;
      await env.BUCKET.put(key, image.stream(), { httpMetadata: { contentType: image.type } });
      uploaded.push(key);
    }
    const db = getDb();
    const [product] = await db.insert(products).values({ name, category, description, price, oldPrice, stock, condition, imageKey: uploaded[0], emoji, inStock: stock > 0 }).returning();
    await db.insert(productImages).values(uploaded.map((key, index) => ({ productId: product.id, imageKey: key, sortOrder: index })));
    return Response.json({ product: cleanProduct(product, uploaded) }, { status: 201 });
  } catch (error) {
    await Promise.all(uploaded.map((key) => env.BUCKET.delete(key)));
    return Response.json({ error: error instanceof Error ? error.message : "Could not publish product" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Incorrect admin password" }, { status: 401 });
  const body = await request.json() as { id?: number; name?: string; category?: string; description?: string; price?: number; oldPrice?: number | null; stock?: number; condition?: string; inStock?: boolean };
  if (!body.id) return Response.json({ error: "Product id is required" }, { status: 400 });
  const values: Partial<typeof products.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) values.name = body.name.trim();
  if (typeof body.category === "string" && body.category.trim()) values.category = body.category.trim();
  if (typeof body.description === "string") values.description = body.description.trim();
  if (typeof body.price === "number" && body.price > 0) values.price = Math.round(body.price);
  if (body.oldPrice === null || typeof body.oldPrice === "number") values.oldPrice = body.oldPrice ? Math.round(body.oldPrice) : null;
  if (typeof body.stock === "number" && body.stock >= 0) values.stock = Math.round(body.stock);
  if (typeof body.condition === "string" && body.condition.trim()) values.condition = body.condition.trim();
  if (typeof body.inStock === "boolean") values.inStock = body.inStock;
  const [product] = await getDb().update(products).set(values).where(eq(products.id, body.id)).returning();
  if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
  const imageRows = await getDb().select().from(productImages).where(eq(productImages.productId, body.id)).orderBy(asc(productImages.sortOrder));
  return Response.json({ product: cleanProduct(product, imageRows.map((row) => row.imageKey)) });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Incorrect admin password" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return Response.json({ error: "Product id is required" }, { status: 400 });
  const [existing] = await getDb().select().from(products).where(eq(products.id, id)).limit(1);
  const imageRows = await getDb().select().from(productImages).where(eq(productImages.productId, id));
  const keys = Array.from(new Set([...imageRows.map((row) => row.imageKey), ...(existing?.imageKey ? [existing.imageKey] : [])]));
  await Promise.all(keys.map((key) => env.BUCKET.delete(key)));
  await getDb().delete(products).where(eq(products.id, id));
  return Response.json({ ok: true });
}
