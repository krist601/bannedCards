import { NextRequest, NextResponse } from "next/server";
import type { DirectorySet } from "@/domain/set-directory";
const examples = [
  ["msh", "Magic | Marvel Super Heroes"],
  ["sos", "Secrets of Strixhaven"],
  ["ecl", "Lorwyn Eclipsed"],
  ["ltr", "The Lord of the Rings: Tales of Middle-earth"],
];
// A small, explicitly demo-only fixture. Production always reads the backend directory.
const sets: DirectorySet[] = examples.map(([code, name]) => ({ code, name, setCodes: [code], releasedAt: null, iconUrl: null, upcoming: false }));
export function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_COMMERCE_MODE !== "demo") return new NextResponse(null, { status: 404 });
  const params = request.nextUrl.searchParams;
  const limit = Number(params.get("limit") ?? 10);
  const requestedOffset = Number(params.get("offset") ?? 0);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10 || !Number.isInteger(requestedOffset) || requestedOffset < 0) return NextResponse.json({ message: "Invalid pagination" }, { status: 400 });
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const filtered = sets.filter(set => set.name.toLowerCase().includes(query) || set.code.includes(query));
  const offset = Math.min(requestedOffset, Math.max(0, Math.ceil(filtered.length / limit) - 1) * limit);
  return NextResponse.json({ sets: filtered.slice(offset, offset + limit), offset, previousOffset: offset > 0 ? Math.max(0, offset - limit) : null, nextOffset: offset + limit < filtered.length ? offset + limit : null, latestSetCodes: ["msh", "sos"] });
}
