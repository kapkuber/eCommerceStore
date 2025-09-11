import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function scoreProduct(q: string, p: { title: string; brand: string | null; description: string | null; slug: string }) {
  const term = q.toLowerCase();
  const title = p.title.toLowerCase();
  const brand = (p.brand || "").toLowerCase();
  const desc = (p.description || "").toLowerCase();
  const slug = p.slug.toLowerCase();
  let score = 0;
  if (title.startsWith(term)) score += 60;
  if (title.includes(term)) score += 40;
  if (brand.startsWith(term)) score += 25;
  if (brand.includes(term)) score += 15;
  if (slug.includes(term)) score += 20;
  if (desc.includes(term)) score += 10;
  // shorter edit distance bias (rough): prefer closer length matches
  score += Math.max(0, 10 - Math.abs(p.title.length - term.length));
  return score;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ items: [] });

  // Fetch a candidate set using case-insensitive contains across key fields
  const candidates = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      images: { orderBy: { sort: "asc" }, take: 1 },
      variants: { orderBy: { createdAt: "asc" }, take: 1 },
    },
    take: 50,
  });

  const items = candidates
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      brand: p.brand,
      price: (p.variants[0]?.priceCents || 0) / 100,
      imageUrl: p.images[0]?.url || null,
      _score: scoreProduct(q, p),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 20)
    .map(({ _score, ...rest }) => rest);

  return NextResponse.json({ items });
}

