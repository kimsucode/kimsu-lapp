import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  revalidateTag("editorial-feed");
  revalidatePath("/");

  return NextResponse.json({ refreshed: true });
}
