"use server";

import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export async function getUserFunds() {
  const supabase = await createClient();
  
  const { data: funds, error } = await supabase
    .from("funds")
    .select("id, name, slug, currency, role:fund_members(role)") 
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching funds:", error);
    return [];
  }
  
  return funds;
}

// Cached request so we don't hit DB twice in one render pass
export const getFundBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("funds")
    .select("id, name, slug, currency")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data;
});