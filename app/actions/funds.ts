"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getUserFunds() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // 1. Check User Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isSuperUser = profile?.role === 'superuser';

  // 2. Fetch Funds
  const { data: funds, error } = await supabase
    .from("funds")
    .select("id, name, slug, currency, role:fund_members(role)") 
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching funds:", error);
    return [];
  }

  // 3. Filter Logic
  return funds.filter(f => {
    // If it's the General Fund, ONLY show to Superusers
    if (f.slug === 'general-fund') {
      return isSuperUser;
    }
    // Show all other funds normally
    return true;
  });
}

// Ensure getFundBySlug is exported here too (from previous steps)
export async function getFundBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("funds").select("*").eq("slug", slug).single();
  return data;
}

export async function createFund(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  // 1. Perform Database Operations inside a Try/Catch
  let successSlug = "";
  
  try {
    const { data, error } = await supabase
      .from("funds")
      .insert({
        name,
        slug,
        owner_id: user.id,
        currency: "PHP"
      })
      .select("slug")
      .single();

    if (error) {
      if (error.code === '23505') throw new Error("Name taken");
      throw new Error(error.message);
    }
    
    successSlug = data.slug;
  } catch (error: any) {
    // If there is a DB error, throw it so the client can display it
    throw new Error(error.message);
  }

  // 2. Revalidate
  revalidatePath("/funds");

  // 3. Redirect OUTSIDE the Try/Catch
  // FIX: Added "/funds/" to the beginning of the path
  redirect(`/funds/${successSlug}/dashboard`); 
}