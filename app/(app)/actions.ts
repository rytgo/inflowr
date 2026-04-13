"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDateOnlyString, toDateOnly } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string): string | null {
  const value = getString(formData, key);
  return value.length ? value : null;
}

function getNumber(formData: FormData, key: string): number {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function getDateOrToday(formData: FormData, key: string): string {
  const value = getString(formData, key);
  if (value && isDateOnlyString(value)) return value;
  return toDateOnly(new Date());
}

function getNullableDate(formData: FormData, key: string): string | null {
  const value = getNullableString(formData, key);
  if (!value) return null;
  return isDateOnlyString(value) ? value : null;
}

function getNullableUrl(formData: FormData, key: string): string | null {
  const value = getNullableString(formData, key);
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function isNextRedirect(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
  );
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function withFlash(path: string, kind: "notice" | "error", message: string): string {
  const [base, hashPart] = path.split("#");
  const url = new URL(base || "/dashboard", "http://localhost");
  url.searchParams.set(kind, message);
  const hash = hashPart ? `#${hashPart}` : "";
  return `${url.pathname}${url.search}${hash}`;
}

function redirectNotice(path: string, message: string) {
  redirect(withFlash(path, "notice", message));
}

function redirectError(path: string, message: string) {
  redirect(withFlash(path, "error", message));
}

async function ensureAuthenticated() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Session expired. Please sign in again.");
  }

  return supabase;
}

function revalidateCoreViews() {
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

async function assertNoError(result: { error: { message: string } | null }) {
  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function createInfluencer(formData: FormData) {
  const fallback = "/influencers";

  try {
    const supabase = await ensureAuthenticated();
    const name = getString(formData, "name");
    const platform = getString(formData, "platform");

    if (!name || !platform) {
      redirectError(fallback, "Name and platform are required.");
    }

    await assertNoError(
      await (supabase.from("influencers") as any).insert({
        name,
        platform,
        profile_url: getNullableUrl(formData, "profile_url"),
        notes: getNullableString(formData, "notes")
      })
    );

    revalidateCoreViews();
    revalidatePath("/influencers");
    redirectNotice(fallback, "Influencer created.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function updateInfluencer(formData: FormData) {
  const id = getString(formData, "id");
  const fallback = id ? `/influencers/${id}` : "/influencers";

  try {
    const supabase = await ensureAuthenticated();
    const name = getString(formData, "name");
    const platform = getString(formData, "platform");

    if (!id || !name || !platform) {
      redirectError(fallback, "Name and platform are required.");
    }

    await assertNoError(
      await (supabase.from("influencers") as any)
        .update({
          name,
          platform,
          profile_url: getNullableUrl(formData, "profile_url"),
          notes: getNullableString(formData, "notes")
        })
        .eq("id", id)
    );

    revalidateCoreViews();
    revalidatePath("/influencers");
    revalidatePath(`/influencers/${id}`);
    redirectNotice(`/influencers/${id}`, "Influencer updated.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function deleteInfluencer(formData: FormData) {
  const id = getString(formData, "id");
  const fallback = id ? `/influencers/${id}` : "/influencers";

  try {
    const supabase = await ensureAuthenticated();

    if (!id) {
      redirectError("/influencers", "Influencer id is missing.");
    }

    await assertNoError(await (supabase.from("influencers") as any).delete().eq("id", id));

    revalidateCoreViews();
    revalidatePath("/influencers");
    redirectNotice("/influencers", "Influencer deleted.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function createCampaign(formData: FormData) {
  const influencerId = getString(formData, "influencer_id");
  const fallback = influencerId ? `/influencers/${influencerId}` : "/influencers";

  try {
    const supabase = await ensureAuthenticated();
    const name = getString(formData, "name");
    const totalValue = getNumber(formData, "total_value");
    const startDate = getNullableDate(formData, "start_date");
    const endDate = getNullableDate(formData, "end_date");

    if (!influencerId || !name || totalValue < 0) {
      redirectError(fallback, "Campaign name and value are required.");
    }

    if (startDate && endDate && startDate > endDate) {
      redirectError(fallback, "End date must be after start date.");
    }

    await assertNoError(
      await (supabase.from("campaigns") as any).insert({
        influencer_id: influencerId,
        name,
        total_value: totalValue,
        notes: getNullableString(formData, "notes"),
        start_date: startDate,
        end_date: endDate
      })
    );

    revalidateCoreViews();
    revalidatePath(`/influencers/${influencerId}`);
    redirectNotice(`/influencers/${influencerId}`, "Campaign created.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function updateCampaign(formData: FormData) {
  const id = getString(formData, "id");
  const fallback = id ? `/campaigns/${id}` : "/dashboard";

  try {
    const supabase = await ensureAuthenticated();
    const name = getString(formData, "name");
    const totalValue = getNumber(formData, "total_value");
    const startDate = getNullableDate(formData, "start_date");
    const endDate = getNullableDate(formData, "end_date");

    if (!id || !name || totalValue < 0) {
      redirectError(fallback, "Campaign name and value are required.");
    }

    if (startDate && endDate && startDate > endDate) {
      redirectError(fallback, "End date must be after start date.");
    }

    await assertNoError(
      await (supabase.from("campaigns") as any)
        .update({
          name,
          total_value: totalValue,
          notes: getNullableString(formData, "notes"),
          start_date: startDate,
          end_date: endDate
        })
        .eq("id", id)
    );

    revalidateCoreViews();
    revalidatePath(`/campaigns/${id}`);
    redirectNotice(`/campaigns/${id}`, "Campaign updated.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function deleteCampaign(formData: FormData) {
  const id = getString(formData, "id");
  const influencerId = getString(formData, "influencer_id");
  const fallback = id ? `/campaigns/${id}` : influencerId ? `/influencers/${influencerId}` : "/influencers";

  try {
    const supabase = await ensureAuthenticated();

    if (!id || !influencerId) {
      redirectError(fallback, "Campaign id is missing.");
    }

    await assertNoError(await (supabase.from("campaigns") as any).delete().eq("id", id));

    revalidateCoreViews();
    revalidatePath(`/influencers/${influencerId}`);
    redirectNotice(`/influencers/${influencerId}`, "Campaign deleted.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function createDeliverable(formData: FormData) {
  const campaignId = getString(formData, "campaign_id");
  const fallback = campaignId ? `/campaigns/${campaignId}#deliverables` : "/dashboard";

  try {
    const supabase = await ensureAuthenticated();
    const title = getString(formData, "title");

    if (!campaignId || !title) {
      redirectError(fallback, "Deliverable title is required.");
    }

    await assertNoError(
      await (supabase.from("deliverables") as any).insert({
        campaign_id: campaignId,
        title,
        due_date: getNullableDate(formData, "due_date"),
        live_url: getNullableUrl(formData, "live_url"),
        is_posted: false,
        posted_at: null
      })
    );

    revalidateCoreViews();
    revalidatePath(`/campaigns/${campaignId}`);
    redirectNotice(`/campaigns/${campaignId}#deliverables`, "Deliverable added.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function updateDeliverable(formData: FormData) {
  const id = getString(formData, "id");
  const campaignId = getString(formData, "campaign_id");
  const fallback = campaignId ? `/campaigns/${campaignId}#deliverables` : "/dashboard";

  try {
    const supabase = await ensureAuthenticated();
    const title = getString(formData, "title");

    if (!id || !campaignId || !title) {
      redirectError(fallback, "Deliverable title is required.");
    }

    const isPosted = formData.get("is_posted") === "on";
    const { data: existing } = await (supabase.from("deliverables") as any)
      .select("is_posted, posted_at")
      .eq("id", id)
      .single();

    const postedAt = isPosted
      ? existing?.is_posted
        ? existing?.posted_at ?? new Date().toISOString()
        : new Date().toISOString()
      : null;

    await assertNoError(
      await (supabase.from("deliverables") as any)
        .update({
          title,
          due_date: getNullableDate(formData, "due_date"),
          live_url: getNullableUrl(formData, "live_url"),
          is_posted: isPosted,
          posted_at: postedAt
        })
        .eq("id", id)
    );

    revalidateCoreViews();
    revalidatePath(`/campaigns/${campaignId}`);
    redirectNotice(`/campaigns/${campaignId}#deliverables`, "Deliverable updated.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function deleteDeliverable(formData: FormData) {
  const id = getString(formData, "id");
  const campaignId = getString(formData, "campaign_id");
  const fallback = campaignId ? `/campaigns/${campaignId}#deliverables` : "/dashboard";

  try {
    const supabase = await ensureAuthenticated();

    if (!id || !campaignId) {
      redirectError(fallback, "Deliverable id is missing.");
    }

    await assertNoError(await (supabase.from("deliverables") as any).delete().eq("id", id));

    revalidateCoreViews();
    revalidatePath(`/campaigns/${campaignId}`);
    redirectNotice(`/campaigns/${campaignId}#deliverables`, "Deliverable deleted.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function createPayment(formData: FormData) {
  const campaignId = getString(formData, "campaign_id");
  const influencerId = getString(formData, "influencer_id");
  const fallback = campaignId ? `/campaigns/${campaignId}#payments` : "/dashboard";

  try {
    const supabase = await ensureAuthenticated();
    const amount = getNumber(formData, "amount");

    if (!campaignId || amount < 0) {
      redirectError(fallback, "Payment amount is required.");
    }

    await assertNoError(
      await (supabase.from("payments") as any).insert({
        campaign_id: campaignId,
        amount,
        payment_date: getDateOrToday(formData, "payment_date"),
        note: getNullableString(formData, "note")
      })
    );

    revalidateCoreViews();
    revalidatePath(`/campaigns/${campaignId}`);
    if (influencerId) revalidatePath(`/influencers/${influencerId}`);
    redirectNotice(`/campaigns/${campaignId}#payments`, "Payment logged.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function updatePayment(formData: FormData) {
  const id = getString(formData, "id");
  const campaignId = getString(formData, "campaign_id");
  const influencerId = getString(formData, "influencer_id");
  const fallback = campaignId ? `/campaigns/${campaignId}#payments` : "/dashboard";

  try {
    const supabase = await ensureAuthenticated();
    const amount = getNumber(formData, "amount");

    if (!id || !campaignId || amount < 0) {
      redirectError(fallback, "Valid payment amount is required.");
    }

    await assertNoError(
      await (supabase.from("payments") as any)
        .update({
          amount,
          payment_date: getDateOrToday(formData, "payment_date"),
          note: getNullableString(formData, "note")
        })
        .eq("id", id)
    );

    revalidateCoreViews();
    revalidatePath(`/campaigns/${campaignId}`);
    if (influencerId) revalidatePath(`/influencers/${influencerId}`);
    redirectNotice(`/campaigns/${campaignId}#payments`, "Payment updated.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

export async function deletePayment(formData: FormData) {
  const id = getString(formData, "id");
  const campaignId = getString(formData, "campaign_id");
  const influencerId = getString(formData, "influencer_id");
  const fallback = campaignId ? `/campaigns/${campaignId}#payments` : "/dashboard";

  try {
    const supabase = await ensureAuthenticated();

    if (!id || !campaignId) {
      redirectError(fallback, "Payment id is missing.");
    }

    await assertNoError(await (supabase.from("payments") as any).delete().eq("id", id));

    revalidateCoreViews();
    revalidatePath(`/campaigns/${campaignId}`);
    if (influencerId) revalidatePath(`/influencers/${influencerId}`);
    redirectNotice(`/campaigns/${campaignId}#payments`, "Payment deleted.");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirectError(fallback, readErrorMessage(error));
  }
}

