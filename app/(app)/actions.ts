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

async function ensureAuthenticated() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated mutation request.");
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
  const supabase = await ensureAuthenticated();
  const name = getString(formData, "name");
  const platform = getString(formData, "platform");

  if (!name || !platform) return;

  await assertNoError(await (supabase.from("influencers") as any).insert({
    name,
    platform,
    profile_url: getNullableUrl(formData, "profile_url"),
    notes: getNullableString(formData, "notes")
  }));

  revalidateCoreViews();
  revalidatePath("/influencers");
}

export async function updateInfluencer(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const platform = getString(formData, "platform");

  if (!id || !name || !platform) return;

  await assertNoError(await (supabase
    .from("influencers") as any)
    .update({
      name,
      platform,
      profile_url: getNullableUrl(formData, "profile_url"),
      notes: getNullableString(formData, "notes")
    })
    .eq("id", id));

  revalidateCoreViews();
  revalidatePath("/influencers");
  revalidatePath(`/influencers/${id}`);
}

export async function deleteInfluencer(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const id = getString(formData, "id");

  if (!id) return;

  await assertNoError(await (supabase.from("influencers") as any).delete().eq("id", id));

  revalidateCoreViews();
  revalidatePath("/influencers");
  redirect("/influencers");
}

export async function createCampaign(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const influencerId = getString(formData, "influencer_id");
  const name = getString(formData, "name");
  const totalValue = getNumber(formData, "total_value");
  const startDate = getNullableDate(formData, "start_date");
  const endDate = getNullableDate(formData, "end_date");

  if (!influencerId || !name || totalValue < 0) return;
  if (startDate && endDate && startDate > endDate) return;

  await assertNoError(await (supabase.from("campaigns") as any).insert({
    influencer_id: influencerId,
    name,
    total_value: totalValue,
    notes: getNullableString(formData, "notes"),
    start_date: startDate,
    end_date: endDate
  }));

  revalidateCoreViews();
  revalidatePath(`/influencers/${influencerId}`);
}

export async function updateCampaign(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const totalValue = getNumber(formData, "total_value");
  const startDate = getNullableDate(formData, "start_date");
  const endDate = getNullableDate(formData, "end_date");

  if (!id || !name || totalValue < 0) return;
  if (startDate && endDate && startDate > endDate) return;

  await assertNoError(await (supabase
    .from("campaigns") as any)
    .update({
      name,
      total_value: totalValue,
      notes: getNullableString(formData, "notes"),
      start_date: startDate,
      end_date: endDate
    })
    .eq("id", id));

  revalidateCoreViews();
  revalidatePath(`/campaigns/${id}`);
}

export async function deleteCampaign(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const id = getString(formData, "id");
  const influencerId = getString(formData, "influencer_id");

  if (!id || !influencerId) return;

  await assertNoError(await (supabase.from("campaigns") as any).delete().eq("id", id));

  revalidateCoreViews();
  revalidatePath(`/influencers/${influencerId}`);
  redirect(`/influencers/${influencerId}`);
}

export async function createDeliverable(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const campaignId = getString(formData, "campaign_id");
  const title = getString(formData, "title");

  if (!campaignId || !title) return;

  await assertNoError(await (supabase.from("deliverables") as any).insert({
    campaign_id: campaignId,
    title,
    due_date: getNullableDate(formData, "due_date"),
    live_url: getNullableUrl(formData, "live_url"),
    is_posted: false,
    posted_at: null
  }));

  revalidateCoreViews();
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function updateDeliverable(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const id = getString(formData, "id");
  const campaignId = getString(formData, "campaign_id");
  const title = getString(formData, "title");

  if (!id || !campaignId || !title) return;

  const isPosted = formData.get("is_posted") === "on";
  const { data: existing } = await (supabase
    .from("deliverables") as any)
    .select("is_posted, posted_at")
    .eq("id", id)
    .single();

  const postedAt = isPosted
    ? existing?.is_posted
      ? existing?.posted_at ?? new Date().toISOString()
      : new Date().toISOString()
    : null;

  await assertNoError(await (supabase
    .from("deliverables") as any)
    .update({
      title,
      due_date: getNullableDate(formData, "due_date"),
      live_url: getNullableUrl(formData, "live_url"),
      is_posted: isPosted,
      posted_at: postedAt
    })
    .eq("id", id));

  revalidateCoreViews();
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function deleteDeliverable(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const id = getString(formData, "id");
  const campaignId = getString(formData, "campaign_id");

  if (!id || !campaignId) return;

  await assertNoError(await (supabase.from("deliverables") as any).delete().eq("id", id));

  revalidateCoreViews();
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function createPayment(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const campaignId = getString(formData, "campaign_id");
  const influencerId = getString(formData, "influencer_id");
  const amount = getNumber(formData, "amount");

  if (!campaignId || amount < 0) return;

  await assertNoError(await (supabase.from("payments") as any).insert({
    campaign_id: campaignId,
    amount,
    payment_date: getDateOrToday(formData, "payment_date"),
    note: getNullableString(formData, "note")
  }));

  revalidateCoreViews();
  revalidatePath(`/campaigns/${campaignId}`);
  if (influencerId) revalidatePath(`/influencers/${influencerId}`);
}

export async function updatePayment(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const id = getString(formData, "id");
  const campaignId = getString(formData, "campaign_id");
  const influencerId = getString(formData, "influencer_id");
  const amount = getNumber(formData, "amount");

  if (!id || !campaignId || amount < 0) return;

  await assertNoError(await (supabase
    .from("payments") as any)
    .update({
      amount,
      payment_date: getDateOrToday(formData, "payment_date"),
      note: getNullableString(formData, "note")
    })
    .eq("id", id));

  revalidateCoreViews();
  revalidatePath(`/campaigns/${campaignId}`);
  if (influencerId) revalidatePath(`/influencers/${influencerId}`);
}

export async function deletePayment(formData: FormData) {
  const supabase = await ensureAuthenticated();
  const id = getString(formData, "id");
  const campaignId = getString(formData, "campaign_id");
  const influencerId = getString(formData, "influencer_id");

  if (!id || !campaignId) return;

  await assertNoError(await (supabase.from("payments") as any).delete().eq("id", id));

  revalidateCoreViews();
  revalidatePath(`/campaigns/${campaignId}`);
  if (influencerId) revalidatePath(`/influencers/${influencerId}`);
}
