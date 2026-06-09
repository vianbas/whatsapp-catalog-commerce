/**
 * Resend email client.
 *
 * Required env var:
 *   RESEND_API_KEY  — API key from resend.com
 *   RESEND_FROM     — verified sender address, e.g. "Toko <noreply@yourdomain.com>"
 */

import { Resend } from "resend"

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

export interface OrderEmailItem {
  name: string
  quantity: number
  price: number
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  items: OrderEmailItem[],
  total: number,
  customerName?: string | null
): Promise<void> {
  if (!email || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const shortId = orderId.slice(0, 8).toUpperCase()
  const greeting = customerName ? `Halo ${customerName},` : "Halo,"

  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${i.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">${formatRp(i.price * i.quantity)}</td>
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
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600">Konfirmasi Pesanan</p>
          <p style="margin:4px 0 0;color:#a1a1aa;font-size:13px">Order #${shortId}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 20px">${greeting}</p>
          <p style="margin:0 0 24px">Terima kasih! Pesanan Anda telah kami terima dan sedang kami proses.</p>

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
                <td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:16px">${formatRp(total)}</td>
              </tr>
            </tfoot>
          </table>

          <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">

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
    subject: `Konfirmasi Pesanan #${shortId}`,
    html,
  })
}
