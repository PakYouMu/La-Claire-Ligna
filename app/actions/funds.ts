"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Standardize response type
export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getUserFunds(): Promise<ActionResponse<any[]>> {
  const supabase = await createClient();
  
  // 1. Safe Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // 2. Check User Role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { 
        success: false, 
        error: `Profile Error (${profileError.code}): ${profileError.message}` 
      };
    }

    const isSuperUser = profile?.role === 'superuser';

    // 3. Fetch Funds
    const { data: funds, error: fundsError } = await supabase
      .from("funds")
      .select("id, name, slug, currency, role:fund_members(role)") 
      .order("created_at", { ascending: true });

    if (fundsError) {
      return { 
        success: false, 
        error: `Profile Error (${fundsError.code}): ${fundsError.message}` 
      };
    }

    // 4. Filter Logic
    const filteredFunds = funds.filter(f => {
      if (f.slug === 'general-fund') return isSuperUser;
      return true;
    });

    return { success: true, data: filteredFunds };

  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

export async function getFundBySlug(slug: string): Promise<ActionResponse<any>> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("funds")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createFund(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const name = formData.get("name") as string;
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
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
      if (error.code === '23505') return { success: false, error: "Name already taken" };
      return { success: false, error: error.message };
    }
    
    successSlug = data.slug;
  } catch (error: any) {
    return { success: false, error: error.message };
  }

  // Success path
  revalidatePath("/funds");
  
  // NOTE: Redirects inside Server Actions are tricky. 
  // Ideally, return success and let the client redirect.
  // But if you must redirect here, do it OUTSIDE the try/catch.
  redirect(`/funds/${successSlug}/dashboard`);
}