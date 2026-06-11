import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: any) {
  const id = (await params).id;
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("durable_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({
    id: job.id,
    status: job.status, // 'pending' | 'processing' | 'completed' | 'failed'
    progress: job.progress,
    result: job.result,
    error: job.error
  });
}
