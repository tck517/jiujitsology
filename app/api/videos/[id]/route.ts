import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch video to get storage_path (RLS ensures only owner's video is returned)
  const { data: video, error: fetchError } = await supabase
    .from("videos")
    .select("id, storage_path")
    .eq("id", id)
    .single();

  if (fetchError || !video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete the video record (cascades to transcriptions, chunks, nodes, edges)
  const { error: deleteError } = await supabase
    .from("videos")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: `Failed to delete: ${deleteError.message}` },
      { status: 500 }
    );
  }

  // Delete the file from Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("videos")
    .remove([video.storage_path]);

  if (storageError) {
    // Log but don't fail — DB record is already gone
    console.error(
      `Failed to delete storage file ${video.storage_path}:`,
      storageError.message
    );
  }

  return new NextResponse(null, { status: 204 });
}
