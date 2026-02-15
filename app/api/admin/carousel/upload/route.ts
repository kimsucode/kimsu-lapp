import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getPublicImageUrl } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get("image");
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { count } = await supabase.from("carousel_images").select("id", { count: "exact", head: true });

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "Maximum 10 images" }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const id = randomUUID();
  const storagePath = `${Date.now()}-${sanitizeFileName(image.name)}`;

  const upload = await supabase.storage.from("carousel").upload(storagePath, buffer, {
    contentType: image.type,
    upsert: false
  });

  if (upload.error) {
    return NextResponse.json({ error: upload.error.message }, { status: 500 });
  }

  const insert = await supabase
    .from("carousel_images")
    .insert({ id, storage_path: storagePath, sort_order: Number.isFinite(sortOrder) ? sortOrder : 0 })
    .select("id, storage_path, sort_order")
    .single();

  if (insert.error || !insert.data) {
    await supabase.storage.from("carousel").remove([storagePath]);
    return NextResponse.json({ error: insert.error?.message || "Insert failed" }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({
    image: {
      id: insert.data.id,
      storagePath: insert.data.storage_path,
      sortOrder: insert.data.sort_order,
      url: getPublicImageUrl(insert.data.storage_path)
    }
  });
}
