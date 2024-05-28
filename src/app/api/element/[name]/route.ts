import { NextResponse } from "next/server";
import { elements } from "@/data";

export async function GET(req: Request, { params }) {
  const { ElementName } = params;

  // random number betwwen 0 and 117
  const random = Math.floor(Math.random() * 117);

  const data = elements[random];
  return NextResponse.json({ data });
}
