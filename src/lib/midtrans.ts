const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const SNAP_BASE_URL = IS_PRODUCTION ? "https://app.midtrans.com/snap/v1" : "https://app.sandbox.midtrans.com/snap/v1";

export interface CreateSnapTokenParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerPhone: string;
  finishRedirectUrl?: string;
}

export async function createSnapToken(params: CreateSnapTokenParams): Promise<string> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY not configured");

  const res = await fetch(`${SNAP_BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Basic " + btoa(`${serverKey}:`),
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      customer_details: {
        first_name: params.customerName,
        phone: params.customerPhone,
      },
      credit_card: { secure: true },
      expiry: { unit: "minute", duration: 1440 },
      ...(params.finishRedirectUrl && {
        callbacks: { finish: params.finishRedirectUrl },
      }),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Midtrans ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { token: string };
  return json.token;
}

interface WebhookBody {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
}

export async function verifyWebhookSignature(body: WebhookBody): Promise<boolean> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;
  const raw = body.order_id + body.status_code + body.gross_amount + serverKey;
  const buf = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(raw));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === body.signature_key;
}

export function mapPaymentStatus(transactionStatus: string, fraudStatus?: string): "paid" | "pending" | "failed" {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" ? "paid" : "pending";
  }
  if (transactionStatus === "settlement") return "paid";
  if (transactionStatus === "pending" || transactionStatus === "deny") return "pending";
  return "failed";
}
