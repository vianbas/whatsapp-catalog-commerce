import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib"
import type { OrderEmailItem } from "@/lib/email"
import { formatRupiah } from "@/lib/utils"

const DARK = rgb(0.1, 0.1, 0.1)
const MUTED = rgb(0.45, 0.45, 0.45)
const LIGHT = rgb(0.94, 0.94, 0.94)

export async function generateInvoicePdf(
  orderId: string,
  items: OrderEmailItem[],
  total: number,
  customerName?: string | null
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage(PageSizes.A4)
  const { width, height } = page.getSize()
  const margin = 56
  const contentWidth = width - margin * 2

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const shortId = orderId.slice(0, 8).toUpperCase()
  const dateStr = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(new Date())

  let y = height - margin

  // Header bar
  page.drawRectangle({
    x: margin,
    y: y - 48,
    width: contentWidth,
    height: 48,
    color: DARK,
  })
  page.drawText("INVOICE", {
    x: margin + 16,
    y: y - 32,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1),
  })
  const idText = `#${shortId}`
  const idWidth = bold.widthOfTextAtSize(idText, 16)
  page.drawText(idText, {
    x: margin + contentWidth - 16 - idWidth,
    y: y - 32,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1),
  })

  y -= 72

  // Meta
  if (customerName) {
    page.drawText(`Kepada: ${customerName}`, { x: margin, y, size: 10, font, color: MUTED })
    y -= 16
  }
  page.drawText(`Tanggal: ${dateStr}`, { x: margin, y, size: 10, font, color: MUTED })
  y -= 32

  // Column headers
  const colItem = margin
  const colQty = margin + contentWidth * 0.6
  const colPrice = margin + contentWidth * 0.75
  const colTotal = margin + contentWidth

  page.drawRectangle({ x: margin, y: y - 18, width: contentWidth, height: 22, color: LIGHT })
  page.drawText("Produk", { x: colItem + 4, y: y - 12, size: 9, font: bold, color: DARK })
  page.drawText("Qty", { x: colQty, y: y - 12, size: 9, font: bold, color: DARK })
  page.drawText("Harga Satuan", { x: colPrice, y: y - 12, size: 9, font: bold, color: DARK })
  const totalHeader = "Subtotal"
  const totalHeaderW = bold.widthOfTextAtSize(totalHeader, 9)
  page.drawText(totalHeader, { x: colTotal - totalHeaderW, y: y - 12, size: 9, font: bold, color: DARK })
  y -= 24

  // Item rows
  for (const item of items) {
    const name = item.name.length > 48 ? item.name.slice(0, 45) + "…" : item.name
    const subtotalStr = formatRupiah(item.price * item.quantity).replace(/ /g, " ")
    const priceStr = formatRupiah(item.price).replace(/ /g, " ")
    const subtotalW = font.widthOfTextAtSize(subtotalStr, 9)

    page.drawText(name, { x: colItem + 4, y, size: 9, font, color: DARK })
    page.drawText(String(item.quantity), { x: colQty, y, size: 9, font, color: DARK })
    page.drawText(priceStr, { x: colPrice, y, size: 9, font, color: MUTED })
    page.drawText(subtotalStr, { x: colTotal - subtotalW, y, size: 9, font, color: DARK })

    y -= 4
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + contentWidth, y },
      thickness: 0.5,
      color: LIGHT,
    })
    y -= 12
  }

  y -= 8

  // Total row
  const totalStr = formatRupiah(total).replace(/ /g, " ")
  const totalW = bold.widthOfTextAtSize(totalStr, 12)
  page.drawText("Total", { x: colPrice, y, size: 11, font: bold, color: DARK })
  page.drawText(totalStr, { x: colTotal - totalW, y, size: 12, font: bold, color: DARK })

  y -= 48

  // Footer
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + contentWidth, y },
    thickness: 0.5,
    color: LIGHT,
  })
  y -= 16
  page.drawText("Terima kasih atas pesanan Anda!", { x: margin, y, size: 9, font, color: MUTED })

  return doc.save()
}
