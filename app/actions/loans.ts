"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFullLoan(formData: FormData) {
  const supabase = await createClient();

  // 1. EXTRACT DATA
  const fundId = formData.get("fund_id") as string;
  const fullName = formData.get("name") as string; // <--- Client sends "name"
  const amount = parseFloat(formData.get("amount") as string);
  const interest = parseFloat(formData.get("interest_rate") as string);
  const duration = parseInt(formData.get("months") as string); // Form sends "months"
  const startDate = formData.get("start_date") as string;
  
  // Handle Signature (File)
  const signatureFile = formData.get("signature") as File | null;

  if (!fundId) throw new Error("Missing Fund ID");
  if (!fullName) throw new Error("Borrower Name is required");

  // 2. NAME SPLITTING LOGIC (Fixes the Error)
  // We split the full name string to satisfy the DB's first_name/last_name columns
  const nameParts = fullName.trim().split(/\s+/);
  let firstName = "";
  let lastName = "";

  if (nameParts.length > 1) {
    // "Michael Ayuban" -> First: "Michael", Last: "Ayuban"
    // "Juan De La Cruz" -> First: "Juan De La", Last: "Cruz"
    lastName = nameParts.pop() || ""; 
    firstName = nameParts.join(" ");
  } else {
    // "Cher" -> First: "Cher", Last: "." (or empty string if DB allows)
    firstName = nameParts[0];
    lastName = "."; // Placeholder to satisfy NOT NULL constraint
  }

  // 3. UPLOAD SIGNATURE (If present)
  let signatureUrl = null;
  if (signatureFile && signatureFile.size > 0) {
    const fileName = `${fundId}/${Date.now()}-sig.png`;
    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(fileName, signatureFile);

    if (uploadError) {
      console.error("Signature upload failed:", uploadError);
      // We continue creating the loan even if signature fails, just log it
    } else {
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(fileName);
      signatureUrl = publicUrlData.publicUrl;
    }
  }

  // 4. FIND OR CREATE BORROWER
  // We check if borrower exists IN THIS FUND first
  const { data: existingBorrower } = await supabase
    .from("borrowers")
    .select("id")
    .eq("fund_id", fundId)
    .ilike("first_name", firstName)
    .ilike("last_name", lastName)
    .single();

  let borrowerId = existingBorrower?.id;

  if (!borrowerId) {
    const { data: newBorrower, error: bError } = await supabase
      .from("borrowers")
      .insert({
        fund_id: fundId,
        first_name: firstName,
        last_name: lastName,
        signature_url: signatureUrl, // Save signature URL if new borrower
      })
      .select("id")
      .single();

    if (bError) throw new Error("Failed to create borrower: " + bError.message);
    borrowerId = newBorrower.id;
  } else if (signatureUrl) {
    // Optional: Update existing borrower's signature if a new one was provided
    await supabase
      .from("borrowers")
      .update({ signature_url: signatureUrl })
      .eq("id", borrowerId);
  }

  // 5. CREATE LOAN
  const { error: lError } = await supabase.from("loans").insert({
    fund_id: fundId,
    borrower_id: borrowerId,
    principal: amount,
    interest_rate: interest,
    duration_months: duration,
    start_date: startDate || new Date().toISOString(),
  });

  if (lError) throw new Error("Failed to create loan: " + lError.message);

  // 6. REVALIDATE
  // Revalidate the specific fund's dashboard and loans list
  revalidatePath(`/base/${fundId}/dashboard`);
  revalidatePath(`/base/${fundId}/loans`);
}