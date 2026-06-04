import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connections } = await supabase
    .from("user_connections")
    .select("provider, is_active, created_at, scope")
    .eq("user_id", user.id)
    .eq("is_active", true);

  return NextResponse.json(
    connections?.map(c => ({ 
      provider: c.provider, 
      connected: c.is_active, 
      connectedAt: c.created_at, 
      scope: c.scope 
    })) || []
  );
}
