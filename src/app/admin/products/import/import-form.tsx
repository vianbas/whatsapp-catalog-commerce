"use client"

import { useRef, useState, useTransition } from "react"
import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { importProducts, type CsvRow, type ImportResult } from "./actions"

const REQUIRED_HEADERS = [
  "name",
  "price",
  "description",
  "stock_quantity",
  "category_slug",
]

function parseLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCSV(text: string): { rows: CsvRow[]; error?: string } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) {
    return {
      rows: [],
      error: "CSV must have a header row and at least one data row.",
    }
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase())
  for (const col of REQUIRED_HEADERS) {
    if (!headers.includes(col)) {
      return { rows: [], error: `Missing required column: "${col}"` }
    }
  }

  const idx = {
    name: headers.indexOf("name"),
    price: headers.indexOf("price"),
    description: headers.indexOf("description"),
    stock_quantity: headers.indexOf("stock_quantity"),
    category_slug: headers.indexOf("category_slug"),
  }

  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const f = parseLine(line)
    const price = parseFloat(f[idx.price] ?? "")
    const qtyRaw = f[idx.stock_quantity] ?? ""
    rows.push({
      name: f[idx.name] ?? "",
      price: isNaN(price) ? 0 : price,
      description: f[idx.description] ?? "",
      stock_quantity: qtyRaw === "" ? null : Number(qtyRaw),
      category_slug: f[idx.category_slug] ?? "",
    })
  }

  return { rows }
}

export function ImportForm() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setParseError(null)
    setRows([])

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows: parsed, error } = parseCSV(text)
      if (error) {
        setParseError(error)
      } else {
        setRows(parsed)
      }
    }
    reader.readAsText(file)
  }

  function handleImport() {
    startTransition(async () => {
      const res = await importProducts(rows)
      setResult(res)
      if (res.imported > 0) {
        setRows([])
        if (fileRef.current) fileRef.current.value = ""
      }
    })
  }

  const isSuccess = result && result.errors.length === 0

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Upload
          className="text-muted-foreground mx-auto mb-3 size-8"
          aria-hidden
        />
        <p className="mb-1 text-sm font-medium">Upload a CSV file</p>
        <p className="text-muted-foreground mb-4 text-xs">
          Required columns:{" "}
          <code className="font-mono">
            name, price, description, stock_quantity, category_slug
          </code>
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="mx-auto block text-sm"
        />
      </div>

      {parseError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {parseError}
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            isSuccess
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <p className="font-semibold">
            {result.imported} product{result.imported !== 1 ? "s" : ""} imported
            successfully.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-4">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {rows.length} row{rows.length !== 1 ? "s" : ""} ready to import
            </p>
            <Button onClick={handleImport} disabled={isPending}>
              {isPending
                ? "Importing…"
                : `Import ${rows.length} product${rows.length !== 1 ? "s" : ""}`}
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Category slug</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {row.name || (
                        <span className="text-red-500">missing</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.price > 0 ? (
                        row.price.toLocaleString("id-ID")
                      ) : (
                        <span className="text-red-500">invalid</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-48 truncate">
                      {row.description || "—"}
                    </TableCell>
                    <TableCell>
                      {row.stock_quantity ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.category_slug || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
