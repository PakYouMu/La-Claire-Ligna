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
  revalidatePath(`/funds/${fundId}/dashboard`);
  revalidatePath(`/funds/${fundId}/loans`);
}

export async function updateLoan(loanId: string, formData: FormData) {
  const supabase = await createClient();

  const principal = parseFloat(formData.get("principal") as string);
  const interest_rate = parseFloat(formData.get("interest_rate") as string);
  const duration_months = parseInt(formData.get("duration_months") as string);
  const start_date = formData.get("start_date") as string;

  const { error } = await supabase
    .from("loans")
    .update({
      principal,
      interest_rate,
      duration_months,
      start_date,
    })
    .eq("id", loanId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/funds/[slug]/loans", "page"); // Revalidate the page
  return { success: true };
}

export async function deleteLoan(loanId: string) {
  const supabase = await createClient();

  // 1. Soft Delete the Loan
  const { error } = await supabase
    .from("loans")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", loanId);

  if (error) {
    return { success: false, error: error.message };
  }

  // 2. Hard Erase the LOAN_DISBURSEMENT ledger record to restore the initial cash on hand
  await supabase
    .from("ledger")
    .delete()
    .eq("loan_id", loanId);

  // 3. Find all associated payments to undo their LOAN_REPAYMENT ledger footprints
  const { data: payments } = await supabase
    .from("payments")
    .select("id")
    .eq("loan_id", loanId);

  if (payments && payments.length > 0) {
    const paymentIds = payments.map(p => p.id);

    // Hard delete the repayment ledger entries
    await supabase
      .from("ledger")
      .delete()
      .in("payment_id", paymentIds);

    // Soft delete the literal payments themselves so statistics forget them
    await supabase
      .from("payments")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", paymentIds);
  }

  // 4. Force kill pending schedules
  await supabase
    .from("payment_schedule")
    .delete()
    .eq("loan_id", loanId)
    .eq("status", "PENDING");

  revalidatePath("/funds/[slug]/dashboard", "page");
  revalidatePath("/funds/[slug]/loans", "page");
  revalidatePath("/funds/[slug]/borrowers", "page");
  return { success: true };
}

export async function voidLoan(loanId: string, reason: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("loans")
    .update({
      is_void: true,
      void_reason: reason
    })
    .eq("id", loanId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Eagerly purge all pending schedules to forcefully drop the loan out of active tracking metrics
  await supabase
    .from("payment_schedule")
    .delete()
    .eq("loan_id", loanId)
    .eq("status", "PENDING");

  revalidatePath("/funds/[slug]/loans", "page");
  revalidatePath("/funds/[slug]/borrowers", "page");
  return { success: true };
}