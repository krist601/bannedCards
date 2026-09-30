import { NextResponse } from "next/server";
export function GET() {
  if (process.env.NEXT_PUBLIC_COMMERCE_MODE !== "demo") return new NextResponse(null, { status: 404 });
  // No fabricated sales: an empty sales history has no best sellers.
  return NextResponse.json({ variantIds: [] });
}
