import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: adverb, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('id', id)
      .eq('part_of_speech', 'adverb')
      .single();

    if (error || !adverb) {
      return NextResponse.json({ error: "Adverb not found" }, { status: 404 });
    }

    return NextResponse.json(adverb);
  } catch (error) {
    console.error("Error fetching adverb:", error);
    return NextResponse.json(
      { error: "Failed to fetch adverb" },
      { status: 500 }
    );
  }
}
