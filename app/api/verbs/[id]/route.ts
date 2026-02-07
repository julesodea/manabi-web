import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: verb, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('id', id)
      .eq('part_of_speech', 'verb')
      .single();

    if (error || !verb) {
      return NextResponse.json({ error: "Verb not found" }, { status: 404 });
    }

    return NextResponse.json(verb);
  } catch (error) {
    console.error("Error fetching verb:", error);
    return NextResponse.json(
      { error: "Failed to fetch verb" },
      { status: 500 }
    );
  }
}
