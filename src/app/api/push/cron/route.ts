import { NextRequest, NextResponse } from "next/server";
import { POST as checkPost } from "../check/route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return checkPost(req);
}

export async function POST(req: NextRequest) {
  return checkPost(req);
}
