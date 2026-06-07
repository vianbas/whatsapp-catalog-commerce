/**
 * Meta WhatsApp Cloud API webhook.
 *
 * Set WHATSAPP_WEBHOOK_VERIFY_TOKEN in .env.local to an arbitrary secret,
 * then register this URL in the Meta App Dashboard under:
 *   WhatsApp → Configuration → Webhook → Callback URL
 *   https://your-domain.com/api/webhook/whatsapp
 *
 * Subscribe to the "messages" field to receive inbound messages and
 * delivery status updates.
 */

import { NextRequest, NextResponse } from "next/server"

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

/** GET — Meta webhook verification challenge. */
export function GET(request: NextRequest): NextResponse {
  const { searchParams } = request.nextUrl
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

/** POST — incoming events from Meta. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new NextResponse("Bad request", { status: 400 })
  }

  // Meta expects a 200 quickly — process async so we don't time out.
  processEvent(body).catch(() => {})

  return new NextResponse("OK", { status: 200 })
}

async function processEvent(payload: unknown): Promise<void> {
  if (!isWebhookPayload(payload)) return

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue

      const { messages = [], statuses = [] } = change.value

      for (const msg of messages) {
        console.log("[WhatsApp] Inbound message", {
          from: msg.from,
          type: msg.type,
          text: msg.text?.body,
        })
      }

      for (const status of statuses) {
        console.log("[WhatsApp] Delivery status", {
          id: status.id,
          status: status.status,
          recipient: status.recipient_id,
        })
      }
    }
  }
}

// ---- Type narrowing ----

interface WebhookMessage {
  from: string
  type: string
  text?: { body: string }
}

interface WebhookStatus {
  id: string
  status: string
  recipient_id: string
}

interface WebhookChangeValue {
  messages?: WebhookMessage[]
  statuses?: WebhookStatus[]
}

interface WebhookChange {
  field: string
  value: WebhookChangeValue
}

interface WebhookEntry {
  changes: WebhookChange[]
}

interface WebhookPayload {
  object: string
  entry: WebhookEntry[]
}

function isWebhookPayload(v: unknown): v is WebhookPayload {
  return (
    typeof v === "object" &&
    v !== null &&
    "object" in v &&
    "entry" in v &&
    Array.isArray((v as WebhookPayload).entry)
  )
}
