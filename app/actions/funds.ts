"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  if (!user) throw new Error("You must be logged in to create a fund.");

  const name = formData.get("name") as string;
  if (!name || name.length < 3) {
    throw new Error("Fund name must be at least 3 characters.");
  }

  // 1. Generate Slug (Simple version: lowercase, dashes, remove special chars)
  // e.g. "My Startup Fund!" -> "my-startup-fund"
  let slug = name.toLowerCase().trim()
    .replace(/[\s_]+/g, '-')     // Spaces/Underscores -> Dashes
    .replace(/[^a-z0-9-]/g, ''); // Remove non-alphanumeric

  // Append a timestamp to ensure uniqueness if needed (Optional but safe)
  // slug = `${slug}-${Date.now().toString().slice(-4)}`;

  // 2. Create the Fund
  const { data: fund, error: fundError } = await supabase
    .from("funds")
    .insert({
      name,
      slug,
      owner_id: user.id,
      currency: "PHP" // Default, could be a form field later
    })
    .select()
    .single();

  if (fundError) {
    // Handle duplicate slug error specifically if you want
    if (fundError.code === '23505') { // Postgres unique constraint violation
      throw new Error("A fund with this name/slug already exists. Please choose another.");
    }
    throw new Error("Failed to create fund: " + fundError.message);
  }

  // 3. Add Creator as 'Owner' in Members
  const { error: memberError } = await supabase
    .from("fund_members")
    .insert({
      fund_id: fund.id,
      user_id: user.id,
      role: "owner"
    });

  if (memberError) {
    // If this fails, we have an orphaned fund. In a real production app, 
    // you'd use a Postgres Function (RPC) to do both in one transaction.
    console.error("Failed to assign ownership:", memberError);
    throw new Error("Fund created but membership failed.");
  }

  // 4. Redirect to the new workspace
  redirect(`/base/${slug}/dashboard`);
}