"use server";

import { createClient } from "@/lib/supabase/server";
import type { Area, Unit, MacroAcao, Channel } from "@/types/catalog";

export async function getAreas(): Promise<Area[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("areas").select("*").order("sort_order");
    return (data || []) as Area[];
  } catch (error) {
    console.error("[getAreas] Error:", error);
    return [];
  }
}

export async function getUnits(): Promise<Unit[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("units").select("*").order("sort_order");
    return (data || []) as Unit[];
  } catch (error) {
    console.error("[getUnits] Error:", error);
    return [];
  }
}

export async function getMacroAcoes(): Promise<MacroAcao[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("macro_acoes").select("*").order("sort_order");
    return (data || []) as MacroAcao[];
  } catch (error) {
    console.error("[getMacroAcoes] Error:", error);
    return [];
  }
}

export async function getChannels(): Promise<Channel[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("channels").select("*").order("sort_order");
    return (data || []) as Channel[];
  } catch (error) {
    console.error("[getChannels] Error:", error);
    return [];
  }
}
