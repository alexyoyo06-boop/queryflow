"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { parseSQL, ParseResult } from "@/lib/sql-parser";
import ExplainPanel from "@/components/ExplainPanel";

const SqlEditor = dynamic(() => import("@/components/SqlEditor"), { ssr: false });
const FlowDiagram = dynamic(() => import("@/components/FlowDiagram"), { ssr: false });

const EXAMPLES = [
  {
    label: "Basic SELECT",
    sql: `SELECT id, name, email\nFROM users\nWHERE age > 18\nORDER BY name ASC\nLIMIT 10`,
  },
  {
    label: "JOIN",
    sql: `SELECT u.name, o.total, o.created_at\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE o.total > 100\nORDER BY o.created_at DESC`,
  },
  {
    label: "GROUP BY + HAVING",
    sql: `SELECT city, COUNT(*) AS total_users, AVG(age) AS avg_age\nFROM users\nWHERE active = 1\nGROUP BY city\nHAVING COUNT(*) > 5\nORDER BY total_users DESC`,
  },
  {
    label: "Multi JOIN",
    sql: `SELECT u.name, p.title, c.name AS category\nFROM users u\nJOIN posts p ON u.id = p.user_id\nJOIN categories c ON p.category_id = c.id\nWHERE p.published = 1\nORDER BY p.created_at DESC\nLIMIT 20`,
  },
];

export default function Home() {
  const [sql, setSql] = useState(EXAMPLES[0].sql);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [hasVisualized, setHasVisualized] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const visualize = useCallback(async () => {
    setError(null);
    const parsed = parseSQL(sql);
    if (parsed.error) {
      setError(parsed.error);
      setResult(null);
      return;
    }
    setResult(parsed);
    setHasVisualized(true);

    // Fetch explanation
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
    } catch {
      // aborted or no API key
    } finally {
      setExplaining(false);
    }
  }, [sql]);

  const loadExample = (exSql: string) => {
    setSql(exSql);
    setResult(null);
    setExplanation("");
    setError(null);
    setHasVisualized(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0e1a" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 52,
          background: "#111827",
          borderBottom: "1px solid #1e2d45",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⬡</span>
          <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 16, letterSpacing: -0.5 }}>
            Query<span style={{ color: "#3b82f6" }}>Flow</span>
          </span>
          <span
            style={{
              color: "#475569",
              fontSize: 11,
              marginLeft: 4,
              background: "#1e2d45",
              padding: "2px 8px",
              borderRadius: 99,
            }}
          >
            SQL Visualizer
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex.sql)}
              style={{
                background: "#1a2235",
                border: "1px solid #1e2d45",
                color: "#64748b",
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.color = "#94a3b8";
                (e.target as HTMLButtonElement).style.borderColor = "#334155";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.color = "#64748b";
                (e.target as HTMLButtonElement).style.borderColor = "#1e2d45";
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left panel - Editor */}
        <div
          style={{
            width: 380,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #1e2d45",
          }}
        >
          {/* Editor label */}
          <div
            style={{
              padding: "8px 14px",
              background: "#0f172a",
              borderBottom: "1px solid #1e2d45",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#334155", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
              SQL EDITOR
            </span>
          </div>

          {/* CodeMirror */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SqlEditor value={sql} onChange={setSql} />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#2d1010",
                borderTop: "1px solid #7f1d1d",
                color: "#fca5a5",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {/* Visualize button */}
          <div
            style={{
              padding: "12px 14px",
              background: "#0f172a",
              borderTop: "1px solid #1e2d45",
              flexShrink: 0,
            }}
          >
            <button
              onClick={visualize}
              style={{
                width: "100%",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: 0.3,
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "#1d4ed8")}
              onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "#2563eb")}
            >
              ▶ Visualize Query
            </button>
          </div>

          {/* Explanation */}
          <ExplainPanel text={explanation} loading={explaining} />
        </div>

        {/* Right panel - Diagram */}
        <div style={{ flex: 1, position: "relative" }}>
          {!hasVisualized && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                zIndex: 1,
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: 64, opacity: 0.07 }}>⬡</span>
              <p style={{ color: "#1e3a5f", fontSize: 14, textAlign: "center", maxWidth: 280 }}>
                Write or select an example query, then click{" "}
                <span style={{ color: "#1d4ed8" }}>Visualize Query</span>
              </p>
            </div>
          )}
          <FlowDiagram result={result} />
        </div>
      </div>
    </div>
  );
}
