import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId");

  if (!nodeId) {
    return NextResponse.json(
      { error: "Missing required parameter: nodeId" },
      { status: 400 }
    );
  }

  // Get all edges connected to this node (as source or target)
  const { data: edges, error } = await supabase
    .from("edges")
    .select("id, source_id, target_id, relationship, properties")
    .eq("user_id", user.id)
    .or(`source_id.eq.${nodeId},target_id.eq.${nodeId}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    edges: (edges || []).map((e) => ({
      ...e,
      properties: (e.properties as Record<string, unknown>) || {},
    })),
    total: edges?.length || 0,
  });
}
