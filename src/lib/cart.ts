"use client"

import * as React from "react"

/**
 * Client-side shopping cart backed by localStorage.
 *
 * Implemented as a tiny external store consumed via `useSyncExternalStore` —
 * no React context/provider needed, any client component can call `useCart()`.
 * `getServerSnapshot` returns a stable empty array so SSR/hydration is safe and
 * we avoid reading localStorage during render.
 */
export interface CartItem {
  id: string
  slug: string
  name: string
  price: number
  image?: string
  quantity: number
}

const STORAGE_KEY = "wcc-cart"
const EMPTY: CartItem[] = []

let cart: CartItem[] = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    cart = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY
  } catch {
    cart = EMPTY
  }
  loaded = true
}

function commit(next: CartItem[]) {
  cart = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore (private mode / quota)
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  load()
  listeners.add(listener)
  // Keep other tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    try {
      cart = e.newValue ? (JSON.parse(e.newValue) as CartItem[]) : EMPTY
    } catch {
      cart = EMPTY
    }
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function getSnapshot() {
  load()
  return cart
}

function getServerSnapshot() {
  return EMPTY
}

export function addToCart(item: Omit<CartItem, "quantity">, qty = 1) {
  load()
  const existing = cart.find((i) => i.id === item.id)
  const next = existing
    ? cart.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
      )
    : [...cart, { ...item, quantity: qty }]
  commit(next)
}

export function setQuantity(id: string, quantity: number) {
  load()
  if (quantity <= 0) {
    removeFromCart(id)
    return
  }
  commit(cart.map((i) => (i.id === id ? { ...i, quantity } : i)))
}

export function removeFromCart(id: string) {
  load()
  commit(cart.filter((i) => i.id !== id))
}

export function clearCart() {
  commit([])
}

export function useCart() {
  const items = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  const count = items.reduce((n, i) => n + i.quantity, 0)
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  return { items, count, total }
}
