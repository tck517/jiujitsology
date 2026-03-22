import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: videos, error } = await supabase
    .from("videos")
    .select("id, title, filename, status, duration_sec, error_message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(videos);
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("video/")) {
    return NextResponse.json(
      { error: "Only video files are accepted" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 500MB limit" },
      { status: 400 }
    );
  }

  // Generate unique storage path
  const fileId = crypto.randomUUID();
  const storagePath = `videos/${user.id}/${fileId}_${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("videos")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Create video record
  const title = file.name.replace(/\.[^/.]+$/, ""); // Strip extension for title
  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      title,
      filename: file.name,
      storage_path: storagePath,
      status: "uploaded",
    })
    .select("id, title, filename, status, created_at")
    .single();

  if (insertError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from("videos").remove([storagePath]);
    return NextResponse.json(
      { error: `Failed to create record: ${insertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json(video, { status: 201 });
}
