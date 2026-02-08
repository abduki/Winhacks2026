"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setUser } from "@/lib/storage";

function validatePassword(pw: string) {
  const missing: string[] = [];
  if (pw.length < 6) missing.push("At least 6 characters");
  if (!/[a-z]/.test(pw)) missing.push("At least 1 lowercase letter");
  if (!/[A-Z]/.test(pw)) missing.push("At least 1 uppercase letter");
  if (!/[0-9]/.test(pw)) missing.push("At least 1 number");
  if (!/[^A-Za-z0-9]/.test(pw)) missing.push("At least 1 special character (e.g. @ # ! $)");
  return missing;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const pwMissing = useMemo(() => validatePassword(password), [password]);

  const onContinue = () => {
    const u = username.trim();
    if (!u) return setErrors(["Please enter a username."]);

    const missing = validatePassword(password);
    if (missing.length) return setErrors(missing);

    if (!accept) return setErrors(["You must accept the terms to continue."]);

    setErrors([]);
    setUser(u); // ✅ keeps bb_* keys
    router.push("/dashboard");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 18,
        background:
          "radial-gradient(1000px 500px at 20% 10%, rgba(255,210,77,.18), transparent 60%)," +
          "radial-gradient(900px 500px at 80% 20%, rgba(255,255,255,.10), transparent 55%)," +
          "var(--bg)",
      }}
    >
      <div style={{ width: "min(980px, 92vw)", display: "grid", gap: 18, gridTemplateColumns: "1.1fr .9fr" }}
        className="loginWrap"
      >
        <section
          style={{
            padding: 28,
            border: "2px solid rgba(255,255,255,.55)",
            background: "rgba(255,255,255,.04)",
            borderRadius: 18,
            boxShadow: "0 12px 35px rgba(0,0,0,.45)",
          }}
        >
          <h1 style={{ fontSize: 40, fontWeight: 850 }}>TrackrBud</h1>
          <p style={{ marginTop: 10, color: "rgba(255,255,255,.82)", fontSize: 14, maxWidth: "48ch" }}>
            Keep your spending under control with My Finance. FunSide comes later.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {["LocalStorage demo auth", "Transactions + budgeting", "Analytics + tips", "Leaderboard"].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  border: "1px solid rgba(255,255,255,.35)",
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(36,0,36,.35)",
                  color: "rgba(255,255,255,.92)",
                  fontWeight: 750,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,.70)" }}>
            Demo-only (browser storage). Use different usernames to compare on leaderboard.
          </p>
        </section>

        <section
          style={{
            padding: 22,
            border: "2px solid rgba(255,255,255,.55)",
            background: "rgba(255,255,255,.04)",
            borderRadius: 18,
            boxShadow: "0 12px 35px rgba(0,0,0,.45)",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 850 }}>Sign in</h2>
          <p style={{ marginTop: 8, color: "rgba(255,255,255,.78)", fontSize: 13 }}>
            Enter username/password and accept terms to continue.
          </p>

          <label htmlFor="username" style={{ marginTop: 14 }}>Username</label>
          <input
            id="username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            placeholder="e.g., imaad"
            autoComplete="username"
            onKeyDown={(e)=> e.key === "Enter" && onContinue()}
          />

          <label htmlFor="password" style={{ marginTop: 14 }}>Password</label>
          <input
            id="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            placeholder="Example: Abc@123"
            type="password"
            autoComplete="current-password"
            onKeyDown={(e)=> e.key === "Enter" && onContinue()}
          />

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: 12,
              border: "2px dashed rgba(255,255,255,.38)",
              borderRadius: 14,
              background: "rgba(36,0,36,.25)",
              marginTop: 14,
            }}
          >
            <input checked={accept} onChange={(e)=>setAccept(e.target.checked)} type="checkbox" style={{ marginTop: 3 }} />
            <div>
              <p style={{ fontWeight: 900, color: "rgba(255,255,255,.95)" }}>Accept Terms</p>
              <p style={{ color: "rgba(255,255,255,.78)", fontSize: 12, lineHeight: 1.45 }}>
                Demo app. Data is stored only in your browser (localStorage). No real authentication.
              </p>
            </div>
          </div>

          <button className="btn" style={{ width: "100%", marginTop: 14, padding: "12px 14px", borderRadius: 14, fontSize: 14 }}
            onClick={onContinue}
          >
            Continue →
          </button>

          {errors.length > 0 && (
            <div
              style={{
                marginTop: 12,
                border: "2px solid rgba(255,77,77,.85)",
                background: "var(--dangerBg)",
                color: "#ffd6d6",
                borderRadius: 14,
                padding: 12,
                fontSize: 12,
              }}
            >
              <b>Password requirements not met:</b>
              <ul style={{ margin: "8px 0 0 18px" }}>
                {errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}

          <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,.70)" }}>
            Password rules: 6+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special.
          </p>

          {/* Optional live hint (not blocking) */}
          {password.length > 0 && pwMissing.length > 0 && errors.length === 0 && (
            <p style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,.65)" }}>
              Missing: {pwMissing.join(", ")}
            </p>
          )}
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 900px){
          .loginWrap{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
