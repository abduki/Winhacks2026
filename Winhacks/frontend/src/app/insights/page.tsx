"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Transaction } from "@/lib/types";
import { getUser, monthKey, onlyThisMonth } from "@/lib/storage";
import { apiGetTransactions } from "@/lib/api";

const fmt = new Intl.NumberFormat("en-CA", { style:"currency", currency:"CAD" });

function summarize(txs: Transaction[]){
  let income = 0, expense = 0;
  txs.forEach(t => {
    if (t.type === "income") income += Number(t.amount || 0);
    else expense += Number(t.amount || 0);
  });
  income = Math.round(income*100)/100;
  expense = Math.round(expense*100)/100;
  const net = Math.round((income - expense)*100)/100;
  return { income, expense, net };
}

function getAllUsersFromStorage(): string[] {
  const users: string[] = [];
  if (typeof window === "undefined") return users;
  for (let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i);
    if (k && k.startsWith("bb_tx_")){
      users.push(k.replace("bb_tx_", ""));
    }
  }
  return Array.from(new Set(users)).sort((a,b)=>a.localeCompare(b));
}

export default function InsightsPage(){
  const router = useRouter();
  const [users, setUsers] = useState<string[]>([]);
  const [rows, setRows] = useState<{user:string; income:number; expense:number; net:number}[]>([]);

  useEffect(() => {
    // If nobody logged in, still allow leaderboard (like your old html),
    // but if you want to force login, uncomment below:
    // if(!getUser()) router.replace("/");
    setUsers(getAllUsersFromStorage());
  }, [router]);

  useEffect(() => {
    (async () => {
      const us = getAllUsersFromStorage();
      const all = await Promise.all(us.map(async (u) => {
        const txs = await apiGetTransactions(u);
        const monthTx = onlyThisMonth(txs);
        return { user: u, ...summarize(monthTx) };
      }));

      all.sort((a,b)=>{
        if (b.net !== a.net) return b.net - a.net;
        if (b.income !== a.income) return b.income - a.income;
        if (a.expense !== b.expense) return a.expense - b.expense;
        return a.user.localeCompare(b.user);
      });

      setRows(all);
    })();
  }, [users]);

  const month = useMemo(()=>monthKey(), []);

  return (
    <main style={{ padding: 18, minHeight:"100vh" }}>
      <div
        style={{
          display:"flex", justifyContent:"space-between", alignItems:"flex-end",
          padding:"14px 14px 16px",
          border:"2px solid var(--line)",
          borderRadius:16,
          background:"var(--cardBg)",
          gap:12, flexWrap:"wrap",
          marginBottom:14
        }}
      >
        <div>
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:".4px", color:"rgba(255,255,255,.82)" }}>TrackrBud</div>
          <h1 style={{ marginTop:6, fontSize:"clamp(28px, 3.2vw, 40px)", fontWeight:850 }}>Leaderboard</h1>
          <div style={{ fontSize:13, color:"var(--muted)", marginTop:8 }}>
            Ranking users by <b>Net (Income − Expense)</b> for the current month.
          </div>
        </div>

        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end" }}>
          <div className="pill">Month: {month}</div>
          <button className="btn2" onClick={()=>router.push("/dashboard")}>Back to My Finance</button>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", display:"grid", gap:16 }}>
        <div className="card">
          <h2 className="cardTitle">Top TrackrBud Users</h2>
          <div className="hint">Gold = #1 • Silver = #2 • Bronze = #3</div>

          <table className="table" style={{ marginTop:12 }}>
            <thead>
              <tr>
                <th style={{ width:70 }}>Rank</th>
                <th>User</th>
                <th style={{ width:170 }}>Income</th>
                <th style={{ width:170 }}>Expense</th>
                <th style={{ width:170 }}>Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color:"rgba(255,255,255,.75)" }}>
                    No users found yet. Add transactions on the dashboard first to populate the leaderboard.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  const topColor =
                    idx === 0 ? "var(--gold)" :
                    idx === 1 ? "var(--silver)" :
                    idx === 2 ? "var(--bronze)" : "rgba(255,255,255,.92)";

                  const badge =
                    idx === 0 ? "#1" :
                    idx === 1 ? "#2" :
                    idx === 2 ? "#3" : "";

                  return (
                    <tr key={r.user}>
                      <td style={{ fontWeight:950, color:"rgba(255,255,255,.88)" }}>{idx+1}</td>
                      <td style={{ fontWeight:950, color: topColor }}>
                        {r.user}
                        {badge && (
                          <span
                            style={{
                              display:"inline-block",
                              marginLeft:8,
                              padding:"3px 8px",
                              borderRadius:999,
                              border:"1px solid rgba(255,255,255,.35)",
                              fontSize:11,
                              fontWeight:950,
                              background:"rgba(0,0,0,.10)",
                              color: topColor
                            }}
                          >
                            {badge}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight:900 }}>{fmt.format(r.income)}</td>
                      <td style={{ fontWeight:900 }}>{fmt.format(r.expense)}</td>
                      <td style={{ fontWeight:900, color: r.net < 0 ? "#ffd6d6" : "#c8ffe9" }}>
                        {fmt.format(r.net)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
