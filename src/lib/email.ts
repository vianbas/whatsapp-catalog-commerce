/**
 * Resend email client.
 *
 * Required env vars:
 *   RESEND_API_KEY  — API key from resend.com
 *   RESEND_FROM     — verified sender address, e.g. "Toko <orders@yourdomain.com>"
 *   APP_URL         — public base URL, e.g. "https://w-commerce.vikoabastian.com"
 */

import { Resend } from "resend"
import { formatRupiah } from "@/lib/utils"

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export interface OrderEmailItem {
  name: string
  quantity: number
  price: number
}

/**
 * Send an order email to the customer.
 * type "received" — order logged, payment pending (WhatsApp checkout).
 * type "paid"     — payment confirmed (Midtrans webhook).
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  items: OrderEmailItem[],
  total: number,
  customerName?: string | null,
  type: "received" | "paid" = "paid"
): Promise<void> {
  if (!email || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const shortId = orderId.slice(0, 8).toUpperCase()
  const safeName = customerName ? escapeHtml(customerName) : null
  const greeting = safeName ? `Halo ${safeName},` : "Halo,"

  const headerText = type === "paid" ? "Konfirmasi Pesanan" : "Pesanan Diterima"
  const bodyText =
    type === "paid"
      ? "Terima kasih! Pembayaran Anda telah berhasil dan pesanan sedang kami proses."
      : "Terima kasih! Pesanan Anda telah kami terima. Kami akan segera menghubungi Anda untuk konfirmasi."
  const subject =
    type === "paid"
      ? `Konfirmasi Pesanan #${shortId}`
      : `Pesanan Diterima #${shortId}`

  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${escapeHtml(i.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">${escapeHtml(formatRupiah(i.price * i.quantity))}</td>
        </tr>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:sans-serif;color:#1a1a1a">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%">
        <!-- Header -->
        <tr><td style="background:#18181b;padding:24px 32px">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600">${headerText}</p>
          <p style="margin:4px 0 0;color:#a1a1aa;font-size:13px">Order #${shortId}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 20px">${greeting}</p>
          <p style="margin:0 0 24px">${bodyText}</p>

          <!-- Items -->
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
            <thead>
              <tr style="color:#71717a;font-size:12px;text-transform:uppercase">
                <th style="padding:0 0 8px;text-align:left;font-weight:500">Produk</th>
                <th style="padding:0 0 8px;text-align:center;font-weight:500">Qty</th>
                <th style="padding:0 0 8px;text-align:right;font-weight:500">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:12px 0 0;font-weight:600">Total</td>
                <td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:16px">${escapeHtml(formatRupiah(total))}</td>
              </tr>
            </tfoot>
          </table>

          <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">

          ${process.env.APP_URL ? `<div style="text-align:center;margin-bottom:24px">
            <a href="${process.env.APP_URL}/orders/${orderId}"
               style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px">
              Lihat Detail Pesanan →
            </a>
          </div>` : ""}

          <p style="margin:0;font-size:13px;color:#71717a">
            Pertanyaan? Balas email ini atau hubungi kami via WhatsApp.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f4f4f5;padding:16px 32px">
          <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center">
            Email ini dikirim otomatis. Harap simpan sebagai bukti pemesanan.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: email,
    subject,
    html,
  })
}

export async function sendTrackingEmail(
  email: string,
  orderId: string,
  courier: string,
  trackingNumber: string,
  customerName?: string | null
): Promise<void> {
  if (!email || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const shortId = orderId.slice(0, 8).toUpperCase()
  const safeName = customerName ? escapeHtml(customerName) : null
  const greeting = safeName ? `Halo ${safeName},` : "Halo,"
  const orderUrl = process.env.APP_URL ? `${process.env.APP_URL}/orders/${orderId}` : null

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:sans-serif;color:#1a1a1a">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="background:#18181b;padding:24px 32px">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600">Pesanan Sedang Dikirim 📦</p>
          <p style="margin:4px 0 0;color:#a1a1aa;font-size:13px">Order #${shortId}</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 20px">${greeting}</p>
          <p style="margin:0 0 24px">Paket Anda sedang dalam perjalanan. Berikut informasi pengiriman:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border:1px solid #f0f0f0;border-radius:6px">
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#71717a;width:40%">Kurir</td>
              <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-weight:600">${escapeHtml(courier)}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#71717a">No. Resi</td>
              <td style="padding:12px 16px;font-weight:600;font-family:monospace;font-size:15px">${escapeHtml(trackingNumber)}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
          ${orderUrl ? `<div style="text-align:center;margin-bottom:24px">
            <a href="${orderUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px">Lihat Detail Pesanan →</a>
          </div>` : ""}
          <p style="margin:0;font-size:13px;color:#71717a">Pertanyaan? Balas email ini atau hubungi kami via WhatsApp.</p>
        </td></tr>
        <tr><td style="background:#f4f4f5;padding:16px 32px">
          <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center">Email ini dikirim otomatis. Harap simpan sebagai bukti pemesanan.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: email,
    subject: `Pesanan #${shortId} Sedang Dikirim`,
    html,
  })
}
