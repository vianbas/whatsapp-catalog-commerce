export interface TrackingEvent {
  date: string
  desc: string
  location: string
}

export interface TrackingResult {
  status: string
  events: TrackingEvent[]
}

// Binderbyte courier code lookup — admin may type the courier in any format.
const COURIER_MAP: Record<string, string> = {
  jne: "jne",
  "jne cargo": "jnecargo",
  "j&t": "jnt",
  "j&t express": "jnt",
  jnt: "jnt",
  "jt cargo": "jtcargo",
  sicepat: "sicepat",
  "sicepat cargo": "sicepatcargo",
  pos: "pos",
  "pos indonesia": "pos",
  tiki: "tiki",
  wahana: "wahana",
  anteraja: "anteraja",
  "id express": "idexpress",
  idexpress: "idexpress",
  "ninja xpress": "ninjaxpress",
  ninjaxpress: "ninjaxpress",
  lion: "lion",
  "lion parcel": "lion",
  sap: "sap",
  "sap express": "sap",
  jet: "jet",
  "first logistics": "firstlogistics",
  pahala: "pahala",
  pandu: "pandu",
  "indah cargo": "indahcargo",
  indah: "indahcargo",
  rpx: "rpx",
  "rpx online": "rpx",
  "ges": "ges",
  "ninja": "ninjaxpress",
}

export function normalizeCourier(raw: string): string | null {
  return COURIER_MAP[raw.trim().toLowerCase()] ?? null
}

export async function fetchTracking(
  apiKey: string,
  courier: string,
  awb: string
): Promise<TrackingResult | null> {
  const code = normalizeCourier(courier)
  if (!code) return null

  try {
    const url = new URL("https://api.binderbyte.com/v1/track")
    url.searchParams.set("api_key", apiKey)
    url.searchParams.set("courier", code)
    url.searchParams.set("awb", awb)

    const res = await fetch(url.toString(), { cache: "no-store" })
    if (!res.ok) return null

    const json = (await res.json()) as {
      status: number
      data?: {
        summary: { status: string }
        history: { date: string; desc: string; location: string }[]
      }
    }
    if (json.status !== 200 || !json.data) return null

    return {
      status: json.data.summary.status,
      events: json.data.history,
    }
  } catch {
    return null
  }
}
