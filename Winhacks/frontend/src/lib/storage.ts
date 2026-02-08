import type { LimitsMap, Transaction } from "./types";

export const CATS = [
  "Necessities","Unnecessary","Food & Drinks","Transport","Subscriptions",
  "Health & Fitness","Entertainment","Savings/Investing","Other"
];

export function getUser(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bb_currentUser");
}

export function setUser(username: string) {
  localStorage.setItem("bb_currentUser", username);

  const users = JSON.parse(localStorage.getItem("bb_users") || "{}");
  if (!users[username]) {
    users[username] = { createdAt: Date.now() };
    localStorage.setItem("bb_users", JSON.stringify(users));
  }

  const txKey = `bb_tx_${username}`;
  if (!localStorage.getItem(txKey)) localStorage.setItem(txKey, JSON.stringify([]));

  const limitKey = `bb_limits_${username}`;
  if (!localStorage.getItem(limitKey)) localStorage.setItem(limitKey, JSON.stringify({}));
}

export function clearUser() {
  localStorage.removeItem("bb_currentUser");
}

export function txKey(u: string){ return `bb_tx_${u}`; }
export function limitsKey(u: string){ return `bb_limits_${u}`; }

export function loadTx(u: string): Transaction[] {
  return JSON.parse(localStorage.getItem(txKey(u)) || "[]");
}
export function saveTx(u: string, arr: Transaction[]) {
  localStorage.setItem(txKey(u), JSON.stringify(arr));
}

export function loadLimits(u: string): LimitsMap {
  return JSON.parse(localStorage.getItem(limitsKey(u)) || "{}");
}
export function saveLimits(u: string, obj: LimitsMap) {
  localStorage.setItem(limitsKey(u), JSON.stringify(obj));
}

export function monthKey(d?: number){
  const dt = d ? new Date(d) : new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
}

export function onlyThisMonth(txs: Transaction[]){
  const mk = monthKey();
  return txs.filter(t => monthKey(t.ts) === mk);
}
