// EMV QCO / QRIS dynamic QR generation (Bank Indonesia spec).
//
// A "static" QRIS string encodes merchant info but no amount (tag 01 = "11").
// A "dynamic" one has tag 01 = "12" and includes tag 54 (transaction amount).
// The seller pastes their static QRIS string once in admin settings; we
// convert it here at checkout time so the buyer sees the exact total in their
// payment app's QR scanner.

interface TLVField {
  tag: string
  value: string
}

function parseTLV(data: string): TLVField[] {
  const fields: TLVField[] = []
  let i = 0
  while (i + 4 <= data.length) {
    const tag = data.substring(i, i + 2)
    i += 2
    const length = parseInt(data.substring(i, i + 2), 10)
    i += 2
    const value = data.substring(i, i + length)
    i += length
    fields.push({ tag, value })
  }
  return fields
}

function encodeTLV(fields: TLVField[]): string {
  return fields
    .map(({ tag, value }) => `${tag}${String(value.length).padStart(2, "0")}${value}`)
    .join("")
}

function crc16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

/**
 * Converts a static QRIS merchant string into a dynamic one with the
 * transaction amount embedded and a fresh CRC-16/CCITT checksum.
 *
 * @throws if `staticQris` doesn't start with the EMV payload indicator "000201"
 */
export function buildDynamicQris(staticQris: string, amountIDR: number): string {
  const clean = staticQris.replace(/\s+/g, "").toUpperCase()
  if (!clean.startsWith("000201")) {
    throw new Error("Invalid QRIS: payload must start with 000201")
  }

  const fields = parseTLV(clean)

  const updated: TLVField[] = fields
    .filter((f) => f.tag !== "63") // drop old CRC — recomputed below
    .map((f) => {
      if (f.tag === "01") return { tag: "01", value: "12" } // dynamic
      if (f.tag === "54") return { tag: "54", value: String(amountIDR) }
      return f
    })

  // Inject tag 54 (amount) if the static QR didn't have one
  if (!updated.find((f) => f.tag === "54")) {
    const idx58 = updated.findIndex((f) => f.tag === "58")
    const amountField: TLVField = { tag: "54", value: String(amountIDR) }
    if (idx58 >= 0) {
      updated.splice(idx58, 0, amountField)
    } else {
      updated.push(amountField)
    }
  }

  const body = encodeTLV(updated) + "6304"
  return body + crc16(body)
}
