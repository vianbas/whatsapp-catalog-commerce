"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchTracking, type TrackingResult } from "@/lib/tracking"

export async function fetchLiveTracking(
  courier: string,
  trackingNumber: string
): Promise<TrackingResult | null> {
  if (!courier || !trackingNumber) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("store_settings")
    .select("tracking_api_key")
    .maybeSingle()

  const apiKey = data?.tracking_api_key
  if (!apiKey) return null

  return fetchTracking(apiKey, courier, trackingNumber)
}
