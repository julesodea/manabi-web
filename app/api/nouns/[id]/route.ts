import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: noun, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('id', id)
      .eq('part_of_speech', 'noun')
      .single();

    if (error || !noun) {
      return NextResponse.json({ error: "Noun not found" }, { status: 404 });
    }

    return NextResponse.json(noun);
  } catch (error) {
    console.error("Error fetching noun:", error);
    return NextResponse.json(
      { error: "Failed to fetch noun" },
      { status: 500 }
    );
  }
}
