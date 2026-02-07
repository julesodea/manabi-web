import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: adjective, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('id', id)
      .eq('part_of_speech', 'adjective')
      .single();

    if (error || !adjective) {
      return NextResponse.json({ error: "Adjective not found" }, { status: 404 });
    }

    return NextResponse.json(adjective);
  } catch (error) {
    console.error("Error fetching adjective:", error);
    return NextResponse.json(
      { error: "Failed to fetch adjective" },
      { status: 500 }
    );
  }
}
