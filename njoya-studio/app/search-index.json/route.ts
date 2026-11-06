import { NextResponse } from "next/server";

import { getSearchIndex } from "@/lib/content/repository";

// A single JSON file on Pages, and the same endpoint in the Node.js build.
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(await getSearchIndex());
}
