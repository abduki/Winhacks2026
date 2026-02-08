"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LimitsMap, Transaction, TxType } from "@/lib/types";
import { CATS, clearUser, getUser, monthKey, onlyThisMonth } from "@/lib/storage";
import { apiGetLimits, apiGetTransactions, apiSaveLimits, apiSaveTransactions } from "@/lib/api";

const fmt = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

function uid() {
  return (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random();
}

function summarize(txs: Transaction[]) {
  let income = 0, expense = 0;
  const byCat: Record<string, number> = {};
  CATS.forEach(c => byCat[c] = 0);

  txs.forEach(t => {
    if (t.type === "income") income += t.amount;
    else {
      expense += t.amount;
      byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    }
  });

  return { income, expense, net: income - expense, byCat };
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUserState] = useState<string | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [limits, setLimits] = useState<LimitsMap>({});

  // Add Transaction form
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>(CATS[0]);
  const [note, setNote] = useState<string>("");
  const [msg, setMsg] = useState<{ text: string; bad?: boolean }>({ text: "" });

  // Panels
  const [tipMode, setTipMode] = useState<"live" | "strict" | "comfort">("live");
  const [analyticsTab, setAnalyticsTab] = useState<"monthly" | "category">("monthly");
  const [budgetTab, setBudgetTab] = useState<"calc" | "limits">("calc");
  const [txTab, setTxTab] = useState<"add" | "import" | "edit" | "remove">("add");

  // Budget calc
  const [overallBudget, setOverallBudget] = useState<string>("");
  const [budgetResult, setBudgetResult] = useState<string>("");

  // Import json
  const [importJson, setImportJson] = useState<string>("");
  const [importMsg, setImportMsg] = useState<string>("");

  // Refs for shortcut scrolling
  const secAddRef = useRef<HTMLDivElement | null>(null);
  const secTransactionsRef = useRef<HTMLDivElement | null>(null);
  const secSavingRef = useRef<HTMLDivElement | null>(null);
  const secAnalyticsRef = useRef<HTMLDivElement | null>(null);
  const secBudgetRef = useRef<HTMLDivElement | null>(null);
  const secTxMgmtRef = useRef<HTMLDivElement | null>(null);

  const pieRef = useRef<HTMLCanvasElement | null>(null);

  const monthTx = useMemo(() => onlyThisMonth(txs), [txs]);
  const sum = useMemo(() => summarize(monthTx), [monthTx]);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/");
      return;
    }
    setUserState(u);

    (async () => {
      const [t, l] = await Promise.all([apiGetTransactions(u), apiGetLimits(u)]);
      setTxs(t);
      setLimits(l);
    })();
  }, [router]);

  useEffect(() => {
    drawPie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sum.byCat]);

  function pulseOnce(el: HTMLElement | null) {
    if (!el) return;
    el.classList.remove("pulseOnce");
    // force reflow
    void el.offsetWidth;
    el.classList.add("pulseOnce");
    setTimeout(() => el.classList.remove("pulseOnce"), 900);
  }

  function scrollTo(el: HTMLElement | null) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    pulseOnce(el);
  }

  // ✅ Shortcut behavior exactly like you asked
  function goCluster(which: "transactions" | "saving" | "analytics" | "budget") {
    if (which === "transactions") {
      scrollTo(secAddRef.current);
      setTimeout(() => pulseOnce(secTransactionsRef.current!), 450);
      return;
    }
    if (which === "saving") return scrollTo(secSavingRef.current);
    if (which === "analytics") return scrollTo(secAnalyticsRef.current);
    if (which === "budget") {
      scrollTo(secBudgetRef.current);
      setTimeout(() => pulseOnce(secTxMgmtRef.current!), 550);
    }
  }

  async function persistTx(next: Transaction[]) {
    if (!user) return;
    setTxs(next);
    await apiSaveTransactions(user, next);
  }

  async function persistLimits(next: LimitsMap) {
    if (!user) return;
    setLimits(next);
    await apiSaveLimits(user, next);
  }

  async function addTx() {
    if (!user) return;

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setMsg({ text: "Enter a valid amount greater than 0.", bad: true });
      return;
    }

    const tx: Transaction = {
      id: uid(),
      ts: Date.now(),
      type,
      amount: Math.round(amt * 100) / 100,
      category,
      note: note.trim(),
    };

    const next = [tx, ...txs];
    setAmount("");
    setNote("");
    setMsg({ text: "Saved ✅" });
    await persistTx(next);
  }

  async function seedExample() {
    if (!user) return;
    const now = Date.now();
    const ex: Omit<Transaction, "id">[] = [
      { ts: now - 86400000 * 2, type: "income", amount: 900, category: "Other", note: "Paycheck" },
      { ts: now - 86400000 * 2, type: "expense", amount: 220, category: "Necessities", note: "Groceries" },
      { ts: now - 86400000 * 1, type: "expense", amount: 45.5, category: "Food & Drinks", note: "Takeout" },
      { ts: now - 86400000 * 1, type: "expense", amount: 17.99, category: "Subscriptions", note: "Streaming" },
      { ts: now - 86400000 * 0, type: "expense", amount: 65, category: "Health & Fitness", note: "Gym" },
      { ts: now - 86400000 * 0, type: "expense", amount: 38, category: "Unnecessary", note: "Impulse buy" },
    ];

    const next = [...ex.map(e => ({ id: uid(), ...e })), ...txs];
    setMsg({ text: "Initial transactions added ✅" });
    await persistTx(next);
  }

  async function resetDemo() {
    if (!user) return;
    setMsg({ text: "Cleared transactions ✅" });
    await persistTx([]);
  }

  async function removeTx(id: string) {
    const next = txs.filter(t => t.id !== id);
    await persistTx(next);
  }

  async function editTx(id: string, field: "amount" | "category" | "note", value: string) {
    const next = txs.map(t => {
      if (t.id !== id) return t;
      if (field === "amount") {
        const num = Number(value);
        if (!num || num <= 0) return t;
        return { ...t, amount: Math.round(num * 100) / 100 };
      }
      if (field === "category") return { ...t, category: value };
      return { ...t, note: value };
    });
    await persistTx(next);
  }

  function drawPie() {
    const canvas = pieRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight || 280;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.fillStyle = "rgba(0,0,0,.08)";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const total = Object.values(sum.byCat).reduce((a, b) => a + b, 0);
    if (total <= 0) {
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = "14px system-ui";
      ctx.fillText("No expenses yet this month.", 20, 40);
      ctx.fillStyle = "rgba(255,255,255,.65)";
      ctx.font = "12px system-ui";
      ctx.fillText("Add an expense to see the pie chart.", 20, 62);
      return;
    }

    const cx = 150, cy = cssHeight / 2, r = 95;
    const colors = [
      "rgba(255,210,77,.85)","rgba(255,255,255,.75)","rgba(52,211,153,.75)",
      "rgba(255,77,77,.70)","rgba(99,102,241,.70)","rgba(236,72,153,.65)",
      "rgba(59,130,246,.65)","rgba(245,158,11,.70)","rgba(168,85,247,.65)"
    ];

    let start = -Math.PI / 2;
    const entries = Object.entries(sum.byCat)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);

    entries.forEach(([_, val], i) => {
      const slice = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      start += slice;
    });

    ctx.font = "12px system-ui";
    let x = 290, y = 36;
    entries.slice(0, 8).forEach(([cat, val], i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, y - 10, 12, 12);
      ctx.fillStyle = "rgba(255,255,255,.92)";
      const pct = ((val / total) * 100).toFixed(0) + "%";
      ctx.fillText(`${cat} (${pct})`, x + 18, y);
      y += 22;
    });
  }

  function renderTips(): { title: string; text: string; kind: "good" | "warn" | "bad" }[] {
    if (monthTx.length === 0) {
      return [{ kind: "warn", title: "No data yet", text: "Add a few transactions to unlock AI recommendations + analytics." }];
    }

    const tips: { title: string; text: string; kind: "good" | "warn" | "bad" }[] = [];
    const strict = tipMode === "strict";
    const comfort = tipMode === "comfort";

    if (sum.net < 0) {
      tips.push({
        kind: "bad",
        title: "Spending exceeds income",
        text: `Net is ${fmt.format(sum.net)}. ${strict ? "Cut non-essentials aggressively this week." : "Trim Unnecessary + Subscriptions this week."}`,
      });
    } else {
      tips.push({
        kind: "good",
        title: "Net positive",
        text: `Net is ${fmt.format(sum.net)}. ${comfort ? "Enjoy a bit, but stay within limits." : "Consider auto-moving a portion into Savings/Investing."}`,
      });
    }

    const total = sum.expense || 0;
    if (total > 0) {
      const unnecessary = sum.byCat["Unnecessary"] || 0;
      const subs = sum.byCat["Subscriptions"] || 0;
      const food = sum.byCat["Food & Drinks"] || 0;

      const unThresh = strict ? 0.18 : comfort ? 0.30 : 0.25;
      const subThresh = strict ? 0.10 : comfort ? 0.16 : 0.12;
      const foodThresh = strict ? 0.25 : comfort ? 0.35 : 0.30;

      if (unnecessary / total > unThresh) {
        tips.push({
          kind: "warn",
          title: "Unnecessary spending is high",
          text: `Unnecessary is ${fmt.format(unnecessary)} (${((unnecessary / total) * 100).toFixed(0)}%). Try a 48-hour rule before buying.`,
        });
      }
      if (subs / total > subThresh) {
        tips.push({
          kind: "warn",
          title: "Subscriptions are rising",
          text: `Subscriptions are ${fmt.format(subs)}. Cancel/rotate services you don’t use weekly.`,
        });
      }
      if (food / total > foodThresh) {
        tips.push({
          kind: "warn",
          title: "Food & Drinks is a big chunk",
          text: `Food & Drinks is ${fmt.format(food)}. Meal-prep 3 days/week or cap takeout.`,
        });
      }
    }

    for (const cat of Object.keys(limits)) {
      const lim = Number(limits[cat]);
      const spent = sum.byCat[cat] || 0;
      if (lim > 0 && spent > lim) {
        tips.push({
          kind: "bad",
          title: "Category limit exceeded",
          text: `${cat} limit: ${fmt.format(lim)} • spent: ${fmt.format(spent)}. Pause spending here until next month.`,
        });
        break;
      }
    }

    return tips;
  }

  function calcRemaining() {
    const overall = Number(overallBudget);
    if (!overall || overall <= 0) {
      setBudgetResult("Enter a total monthly budget first.");
      return;
    }
    const left = overall - sum.expense;
    setBudgetResult(`Budget left: ${fmt.format(left)}`);
  }

  function suggestSpend() {
    const overall = Number(overallBudget);
    if (!overall || overall <= 0) {
      setBudgetResult("Enter a total monthly budget to get a daily suggestion.");
      return;
    }
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const day = new Date().getDate();
    const daysLeft = Math.max(1, daysInMonth - day + 1);

    const left = overall - sum.expense;
    const perDay = left / daysLeft;
    setBudgetResult(`Suggested: ${fmt.format(perDay)} per day for the rest of the month.`);
  }

  async function updateLimit(cat: string, val: string) {
    const num = Number(val);
    const next = { ...limits };
    if (!val) delete next[cat];
    else next[cat] = Math.round(num * 100) / 100;
    await persistLimits(next);
  }

  async function clearAllLimits() {
    await persistLimits({});
  }

  async function importFromJson() {
    setImportMsg("");
    let parsed: any;
    try {
      parsed = JSON.parse(importJson);
    } catch {
      setImportMsg("Invalid JSON. Paste a valid array.");
      return;
    }
    if (!Array.isArray(parsed)) {
      setImportMsg("JSON must be an array of transactions.");
      return;
    }

    let added = 0;
    const next = [...txs];

    parsed.forEach((item: any) => {
      if (!item || (item.type !== "expense" && item.type !== "income")) return;
      const amt = Number(item.amount);
      if (!amt || amt <= 0) return;
      const cat = CATS.includes(item.category) ? item.category : "Other";
      next.unshift({
        id: uid(),
        ts: typeof item.ts === "number" ? item.ts : Date.now(),
        type: item.type,
        amount: Math.round(amt * 100) / 100,
        category: cat,
        note: String(item.note || ""),
      });
      added++;
    });

    setImportMsg(`Imported ${added} transaction(s) ✅`);
    await persistTx(next);
  }

  function logout() {
    clearUser();
    router.push("/");
  }

  if (!user) return null;

  const tips = renderTips();

  return (
    <main style={{ padding: 18 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "14px 14px 16px",
          border: "2px solid var(--line)",
          borderRadius: 16,
          background: "var(--cardBg)",
          marginBottom: 14,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".4px", color: "rgba(255,255,255,.82)" }}>
            TrackrBud
          </div>
          <h1 style={{ marginTop: 6, fontSize: "clamp(28px, 3.2vw, 40px)", fontWeight: 850 }}>My Finance</h1>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
            Sidebar buttons act as shortcuts to their function clusters.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div className="pill">User: {user}</div>
          <div className="pill">Month: {monthKey()}</div>
          <button className="btn2" onClick={() => router.push("/insights")}>Leaderboard</button>
          <button className="btn2 btnDanger" onClick={logout}>Log out</button>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
        {/* Shortcut buttons */}
        <div style={{ display: "grid", gap: 14, position: "sticky", top: 14, alignSelf: "start" }}>
          <button className="shortcutBtn"
            style={miniBtnStyle(true)}
            onClick={() => goCluster("transactions")}
          >
            🧾<small style={miniSmallStyle}>Transactions</small>
          </button>

          <button className="shortcutBtn"
            style={miniBtnStyle(false)}
            onClick={() => goCluster("saving")}
          >
            💡<small style={miniSmallStyle}>Saving Tips</small>
          </button>

          <button className="shortcutBtn"
            style={miniBtnStyle(false)}
            onClick={() => goCluster("analytics")}
          >
            📊<small style={miniSmallStyle}>Analytics</small>
          </button>

          <button className="shortcutBtn"
            style={miniBtnStyle(false)}
            onClick={() => goCluster("budget")}
          >
            🧮<small style={miniSmallStyle}>Budgeting</small>
          </button>
        </div>

        {/* Main column */}
        <div style={{ width: "100%", maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 1) Add Transaction */}
          <div className="card" ref={secAddRef}>
            <h2 className="cardTitle">Add Transaction</h2>
            <div className="hint">Add a transaction — your analytics/tips update automatically.</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div>
                <label>Type</label>
                <select value={type} onChange={(e)=>setType(e.target.value as TxType)}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label>Amount (CAD)</label>
                <input value={amount} onChange={(e)=>setAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="e.g., 25.50" />
              </div>
            </div>

            <label>Category</label>
            <select value={category} onChange={(e)=>setCategory(e.target.value)}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label>Note</label>
            <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="e.g., groceries, coffee, gym..." />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button className="btn" onClick={addTx}>Add</button>
              <button className="btn2" onClick={seedExample}>Build initial transaction</button>
              <button className="btn2 btnDanger" onClick={resetDemo}>Reset demo data</button>
            </div>

            {msg.text && (
              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, color: msg.bad ? "#ffd6d6" : "#c8ffe9" }}>
                {msg.text}
              </div>
            )}
          </div>

          {/* 2) Transactions */}
          <div className="card" ref={secTransactionsRef}>
            <h2 className="cardTitle">Transactions</h2>
            <div className="hint">Latest transactions for this month (stored locally).</div>

            <div style={{ marginTop: 12 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Date</th>
                    <th style={{ width: 90 }}>Type</th>
                    <th style={{ width: 160 }}>Category</th>
                    <th style={{ width: 120 }}>Amount</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {monthTx.slice(0, 12).length === 0 ? (
                    <tr><td colSpan={5} style={{ color: "rgba(255,255,255,.75)" }}>No transactions yet this month.</td></tr>
                  ) : (
                    monthTx.slice(0, 12).map(t => (
                      <tr key={t.id}>
                        <td>{new Date(t.ts).toLocaleDateString("en-CA")}</td>
                        <td><span className={`tag ${t.type}`}>{t.type}</span></td>
                        <td>{t.category}</td>
                        <td>{fmt.format(t.amount)}</td>
                        <td style={{ color: "rgba(255,255,255,.75)" }}>{t.note}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overview */}
          <div className="card">
            <h2 className="cardTitle">Overview</h2>
            <div className="hint">Spending Breakdown (this month)</div>
            <div style={{ marginTop: 12 }}>
              <canvas
                ref={pieRef}
                style={{
                  width: "100%",
                  height: 280,
                  maxWidth: "100%",
                  borderRadius: 14,
                  background: "rgba(0,0,0,.08)",
                  border: "1px solid rgba(255,255,255,.22)",
                }}
              />
            </div>
          </div>

          {/* Saving Tips */}
          <div className="card" ref={secSavingRef}>
            <h2 className="cardTitle">Saving Tips</h2>

            <div className="subOptions">
              <div className={`chip ${tipMode==="live"?"active":""}`} onClick={()=>setTipMode("live")}>AI-Based Recommendations</div>
              <div className={`chip ${tipMode==="strict"?"active":""}`} onClick={()=>setTipMode("strict")}>Strict</div>
              <div className={`chip ${tipMode==="comfort"?"active":""}`} onClick={()=>setTipMode("comfort")}>Comfort</div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {tips.map((t, i) => (
                <div key={i}
                  style={{
                    border: "2px solid rgba(255,255,255,.28)",
                    borderColor:
                      t.kind === "bad" ? "rgba(255,77,77,.70)" :
                      t.kind === "good" ? "rgba(52,211,153,.65)" :
                      "rgba(255,210,77,.65)",
                    borderRadius: 14,
                    padding: 12,
                    background: "rgba(0,0,0,.10)",
                    fontSize: 12,
                    lineHeight: 1.45
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>{t.title}</div>
                  <div style={{ color: "rgba(255,255,255,.82)" }}>{t.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div className="card" ref={secAnalyticsRef}>
            <h2 className="cardTitle">Analytics & Insights</h2>

            <div className="subOptions">
              <div className={`chip ${analyticsTab==="monthly"?"active":""}`} onClick={()=>setAnalyticsTab("monthly")}>Monthly Comparisons</div>
              <div className={`chip ${analyticsTab==="category"?"active":""}`} onClick={()=>setAnalyticsTab("category")}>Category Insights</div>
            </div>

            {analyticsTab === "category" ? (
              <>
                <div className="hint" style={{ marginBottom: 10 }}>Category Insights (this month)</div>
                <table className="table">
                  <thead><tr><th>Category</th><th>Expense</th><th>Share</th></tr></thead>
                  <tbody>
                    {Object.entries(sum.byCat).sort((a,b)=>b[1]-a[1]).map(([c,v])=>{
                      const total = sum.expense || 0;
                      const pct = total ? `${((v/total)*100).toFixed(0)}%` : "0%";
                      return <tr key={c}><td>{c}</td><td>{fmt.format(v)}</td><td>{pct}</td></tr>;
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <div className="hint" style={{ marginBottom: 10 }}>Monthly Comparisons (last 4 months)</div>
                <table className="table">
                  <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr></thead>
                  <tbody>
                    {Array.from({ length: 4 }).map((_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - i);
                      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
                      const monthAll = txs.filter(t => {
                        const dt = new Date(t.ts);
                        const mk = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
                        return mk === key;
                      });
                      const s = summarize(monthAll);
                      return (
                        <tr key={key}>
                          <td>{key}</td>
                          <td>{fmt.format(s.income)}</td>
                          <td>{fmt.format(s.expense)}</td>
                          <td>{fmt.format(s.net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Budgeting */}
          <div className="card" ref={secBudgetRef}>
            <h2 className="cardTitle">Budgeting & Tracking</h2>

            <div className="subOptions">
              <div className={`chip ${budgetTab==="calc"?"active":""}`} onClick={()=>setBudgetTab("calc")}>Financial Calculator</div>
              <div className={`chip ${budgetTab==="limits"?"active":""}`} onClick={()=>setBudgetTab("limits")}>Set Category Limits</div>
            </div>

            {budgetTab === "calc" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label>Total monthly budget</label>
                    <input value={overallBudget} onChange={(e)=>setOverallBudget(e.target.value)} type="number" min="0" step="0.01" placeholder="e.g., 1200" />
                  </div>
                  <div>
                    <label>Your current expenses (this month)</label>
                    <input value={fmt.format(sum.expense)} disabled />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <button className="btn" onClick={calcRemaining}>Calculate budget left</button>
                  <button className="btn2" onClick={suggestSpend}>How much we can spend (per day)</button>
                </div>
                {budgetResult && (
                  <div className="hint" style={{ marginTop: 10 }}>
                    {budgetResult}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="hint" style={{ marginBottom: 10 }}>Set limits for categories (stored locally)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", gap: 10, alignItems: "center", fontWeight: 900 }}>
                  <div>Category</div><div>Limit (CAD)</div><div>Spent (CAD)</div>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,.16)", margin: "12px 0" }} />
                <div style={{ display: "grid", gap: 10 }}>
                  {CATS.map(cat => {
                    const lim = Number(limits[cat] || 0);
                    const spent = Number(sum.byCat[cat] || 0);
                    const over = lim > 0 && spent > lim;
                    return (
                      <div key={cat} style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", gap: 10, alignItems: "center" }}>
                        <div>{cat}</div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={lim || ""}
                            placeholder="no limit"
                            onChange={(e)=>updateLimit(cat, e.target.value)}
                          />
                        </div>
                        <div style={{ color: over ? "#ffd6d6" : "rgba(255,255,255,.85)", fontWeight: 900 }}>
                          {fmt.format(spent)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button className="btn2" onClick={clearAllLimits}>Clear all limits</button>
                </div>
              </>
            )}
          </div>

          {/* Transaction Management */}
          <div className="card" ref={secTxMgmtRef}>
            <h2 className="cardTitle">Transaction Management</h2>

            <div className="subOptions">
              <div className={`chip ${txTab==="add"?"active":""}`} onClick={()=>setTxTab("add")}>Add Transaction</div>
              <div className={`chip ${txTab==="import"?"active":""}`} onClick={()=>setTxTab("import")}>Import from JSON</div>
              <div className={`chip ${txTab==="edit"?"active":""}`} onClick={()=>setTxTab("edit")}>Edit Transactions</div>
              <div className={`chip ${txTab==="remove"?"active":""}`} onClick={()=>setTxTab("remove")}>Remove Transactions</div>
              <div className="chip" onClick={seedExample}>Build Initial Transaction</div>
            </div>

            {txTab === "add" && (
              <>
                <div className="hint">Use the “Add Transaction” card above.</div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button className="btn" onClick={()=>scrollTo(secAddRef.current)}>Go to Add Transaction</button>
                </div>
              </>
            )}

            {txTab === "import" && (
              <>
                <div className="hint" style={{ marginBottom: 10 }}>
                  Paste an array of JSON transactions:
                  <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,.82)" }}>
                    [{` { "type":"expense","amount":12.5,"category":"Food & Drinks","note":"coffee","ts":1700000000000 } `}]
                  </div>
                </div>
                <textarea value={importJson} onChange={(e)=>setImportJson(e.target.value)}
                  placeholder='[{"type":"expense","amount":10,"category":"Other","note":"test"}]'
                />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button className="btn" onClick={importFromJson}>Import from JSON</button>
                </div>
                {importMsg && <div className="hint" style={{ marginTop: 10 }}>{importMsg}</div>}
              </>
            )}

            {(txTab === "edit" || txTab === "remove") && (
              <>
                {monthTx.length === 0 ? (
                  <div className="hint">No transactions this month.</div>
                ) : (
                  <>
                    <div className="hint" style={{ marginBottom: 10 }}>
                      {txTab === "edit" ? "Edit amount/category/note (saves instantly)." : "Remove transactions (cannot undo)."}
                    </div>

                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 110 }}>Date</th>
                          <th style={{ width: 90 }}>Type</th>
                          <th>Category</th>
                          <th style={{ width: 120 }}>Amount</th>
                          <th>Note</th>
                          <th style={{ width: 120 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthTx.slice(0, 12).map(t => (
                          <tr key={t.id}>
                            <td>{new Date(t.ts).toLocaleDateString("en-CA")}</td>
                            <td><span className={`tag ${t.type}`}>{t.type}</span></td>

                            <td>
                              {txTab === "edit" ? (
                                <select defaultValue={t.category} onChange={(e)=>editTx(t.id,"category",e.target.value)}>
                                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              ) : (
                                t.category
                              )}
                            </td>

                            <td>
                              {txTab === "edit" ? (
                                <input type="number" min="0" step="0.01" defaultValue={t.amount}
                                  onChange={(e)=>editTx(t.id,"amount",e.target.value)}
                                />
                              ) : (
                                fmt.format(t.amount)
                              )}
                            </td>

                            <td>
                              {txTab === "edit" ? (
                                <input defaultValue={t.note} onChange={(e)=>editTx(t.id,"note",e.target.value)} />
                              ) : (
                                <span style={{ color: "rgba(255,255,255,.75)" }}>{t.note}</span>
                              )}
                            </td>

                            <td>
                              {txTab === "remove" ? (
                                <button className="btn2 btnDanger" onClick={()=>removeTx(t.id)}>Remove</button>
                              ) : (
                                <span style={{ color: "rgba(255,255,255,.75)", fontWeight: 900 }}>Auto</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 820px){
          main > div + div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

function miniBtnStyle(active: boolean) {
  return {
    width: 92,
    height: 92,
    borderRadius: 16,
    border: "2px solid var(--line)",
    background: "rgba(255,255,255,.03)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    fontWeight: 900,
    outline: active ? "3px solid rgba(255,210,77,.25)" : "none",
  } as const;
}

const miniSmallStyle = {
  display: "block",
  fontSize: 11,
  color: "rgba(255,255,255,.78)",
  marginTop: 6,
  fontWeight: 850,
  letterSpacing: ".2px",
} as const;
