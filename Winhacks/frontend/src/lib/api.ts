import type { LimitsMap, Transaction } from "./types";
import { loadLimits, loadTx, saveLimits, saveTx } from "./storage";

// ✅ Later set this true when backend is ready
const USE_API = false;

export async function apiGetTransactions(user: string): Promise<Transaction[]> {
  if (!USE_API) return loadTx(user);
  const res = await fetch(`/api/transactions?user=${encodeURIComponent(user)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function apiSaveTransactions(user: string, txs: Transaction[]) {
  if (!USE_API) return saveTx(user, txs);
  const res = await fetch(`/api/transactions?user=${encodeURIComponent(user)}`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ txs }),
  });
  if (!res.ok) throw new Error("Failed to save transactions");
}

export async function apiGetLimits(user: string): Promise<LimitsMap> {
  if (!USE_API) return loadLimits(user);
  const res = await fetch(`/api/limits?user=${encodeURIComponent(user)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch limits");
  return res.json();
}

export async function apiSaveLimits(user: string, limits: LimitsMap) {
  if (!USE_API) return saveLimits(user, limits);
  const res = await fetch(`/api/limits?user=${encodeURIComponent(user)}`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ limits }),
  });
  if (!res.ok) throw new Error("Failed to save limits");
}
