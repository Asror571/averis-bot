import { NextResponse } from "next/server";

export async function GET() {
  const mem = (global as any)._local_mem_db || {};
  return NextResponse.json({ mem });
}
