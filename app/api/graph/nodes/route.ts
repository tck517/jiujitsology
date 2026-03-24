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
  const type = searchParams.get("type");
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = (page - 1) * limit;

  // Get total count
  let countQuery = supabase
    .from("nodes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (type) {
    countQuery = countQuery.eq("type", type);
  }

  const { count } = await countQuery;

  // Get paginated nodes
  let nodesQuery = supabase
    .from("nodes")
    .select("id, type, label, properties")
    .eq("user_id", user.id)
    .order("type")
    .order("label")
    .range(offset, offset + limit - 1);

  if (type) {
    nodesQuery = nodesQuery.eq("type", type);
  }

  const { data: nodes, error } = await nodesQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    nodes: (nodes || []).map((n) => ({
      ...n,
      properties: (n.properties as Record<string, unknown>) || {},
    })),
    total: count || 0,
    page,
    limit,
  });
}
