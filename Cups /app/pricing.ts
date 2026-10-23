export function estimate(quantity: number, unitCents: number, discount: number) { const subtotal = Math.round(quantity) * Math.round(unitCents); const savings = Math.round(subtotal * discount / 100); return { subtotal, savings, total: subtotal - savings }; }
export function money(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100); }
