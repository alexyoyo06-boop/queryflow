"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { parseSQL, ParseResult } from "@/lib/sql-parser";
import ExplainPanel from "@/components/ExplainPanel";

const SqlEditor = dynamic(() => import("@/components/SqlEditor"), { ssr: false });
const FlowDiagram = dynamic(() => import("@/components/FlowDiagram"), { ssr: false });

const EXAMPLES = [
  { label: "SELECT", sql: `SELECT id, name, email\nFROM users\nWHERE age > 18\nORDER BY name ASC\nLIMIT 10` },
  { label: "JOIN", sql: `SELECT u.name, o.total, o.created_at\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE o.total > 100\nORDER BY o.created_at DESC` },
  { label: "GROUP BY", sql: `SELECT city, COUNT(*) AS total_users, AVG(age) AS avg_age\nFROM users\nWHERE active = 1\nGROUP BY city\nHAVING COUNT(*) > 5\nORDER BY total_users DESC` },
  { label: "MULTI JOIN", sql: `SELECT u.name, p.title, c.name AS category\nFROM users u\nJOIN posts p ON u.id = p.user_id\nJOIN categories c ON p.category_id = c.id\nWHERE p.published = 1\nORDER BY p.created_at DESC\nLIMIT 20` },
];

export default function Home() {
  const [sql, setSql] = useState(EXAMPLES[0].sql);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [activeExample, setActiveExample] = useState(0);
  const [hasVisualized, setHasVisualized] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") visualize();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const visualize = useCallback(async () => {
    setError(null);
    const parsed = parseSQL(sql);
    if (parsed.error) { setError(parsed.error); setResult(null); return; }
    setResult(parsed);
    setHasVisualized(true);
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setExplanation("");
    setExplaining(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
        signal: ctrl.signal,
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setExplanation((prev) => prev + decoder.decode(value));
      }
    } catch { /* aborted */ } finally { setExplaining(false); }
  }, [sql]);

  const loadExample = (idx: number) => {
    setActiveExample(idx);
    setSql(EXAMPLES[idx].sql);
    setResult(null);
    setExplanation("");
    setError(null);
    setHasVisualized(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: 48,
        background: "white",
        borderBottom: "2px solid #0a0a0a",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#0a0a0a" }}>
          QUERY<span style={{ color: "#ff2b2b" }}>FLOW</span>
        </span>

        <div style={{ display: "flex", border: "2px solid #0a0a0a", overflow: "hidden" }}>
          {EXAMPLES.map((ex, i) => (
            <button
              key={ex.label}
              onClick={() => loadExample(i)}
              style={{
                background: activeExample === i ? "#0a0a0a" : "white",
                color: activeExample === i ? "white" : "#0a0a0a",
                border: "none",
                borderRight: i < EXAMPLES.length - 1 ? "2px solid #0a0a0a" : "none",
                fontSize: 11,
                padding: "4px 14px",
                cursor: "pointer",
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                letterSpacing: "0.05em",
                transition: "all 0.1s",
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <span style={{ fontFamily: "'Space Mono', monospace", color: "#aaa", fontSize: 10, letterSpacing: "0.05em" }}>
          CTRL+ENTER
        </span>
      </header>

      {/* Main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: Editor */}
        <div style={{
          width: 360,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "2px solid #0a0a0a",
          background: "white",
        }}>
          {/* Tab bar */}
          <div style={{
            padding: "0 16px",
            height: 36,
            display: "flex",
            alignItems: "center",
            borderBottom: "2px solid #0a0a0a",
            gap: 6,
          }}>
            <span style={{ fontFamily: "'Space Mono', monospace", color: "#ff2b2b", fontSize: 10, fontWeight: 700 }}>●</span>
            <span style={{ fontFamily: "'Space Mono', monospace", color: "#aaa", fontSize: 10, letterSpacing: "0.08em" }}>query.sql</span>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SqlEditor value={sql} onChange={setSql} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "8px 16px",
              background: "#ff2b2b",
              borderTop: "2px solid #0a0a0a",
              color: "white",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
            }}>
              ✗ {error}
            </div>
          )}

          {/* Run button */}
          <div style={{ padding: "12px 16px", borderTop: "2px solid #0a0a0a", background: "white" }}>
            <button
              onClick={visualize}
              style={{
                width: "100%",
                background: "#0a0a0a",
                color: "white",
                border: "2px solid #0a0a0a",
                padding: "10px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.1em",
                fontFamily: "'Space Mono', monospace",
                transition: "transform 0.1s, box-shadow 0.1s",
                boxShadow: "3px 3px 0 #555",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(-2px, -2px)";
                e.currentTarget.style.boxShadow = "5px 5px 0 #555";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translate(0, 0)";
                e.currentTarget.style.boxShadow = "3px 3px 0 #555";
              }}
            >
              ▶ VISUALIZE
            </button>
          </div>

          {/* Explanation */}
          <ExplainPanel text={explanation} loading={explaining} />
        </div>

        {/* Right: Diagram */}
        <div style={{ flex: 1, position: "relative", background: "var(--bg)" }}>
          {/* Dot grid */}
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#c8c5be" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>

          {/* Empty state */}
          {!hasVisualized && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              zIndex: 1,
              pointerEvents: "none",
            }}>
              <div style={{
                border: "2px solid #0a0a0a",
                background: "white",
                padding: "20px 32px",
                boxShadow: "4px 4px 0 #0a0a0a",
                textAlign: "center",
              }}>
                <p style={{ fontFamily: "'Space Mono', monospace", color: "#aaa", fontSize: 10, letterSpacing: "0.08em" }}>
                  WRITE A QUERY AND PRESS
                </p>
                <p style={{ fontFamily: "'Space Mono', monospace", color: "#0a0a0a", fontSize: 14, fontWeight: 700, marginTop: 6, letterSpacing: "0.05em" }}>
                  CTRL+ENTER
                </p>
              </div>
            </div>
          )}

          <FlowDiagram result={hasVisualized ? result : null} />
        </div>
      </div>
    </div>
  );
}
