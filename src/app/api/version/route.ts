import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

export async function GET() {
  const version = process.env.APP_VERSION || packageJson.version || "dev";
  
  return NextResponse.json({ version });
}
