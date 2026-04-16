"use client";

import { Handle, Position } from "reactflow";
import { NodeType } from "@/lib/sql-parser";

const NODE_CONFIG: Record<NodeType, { color: string; bg: string; border: string; icon: string }> = {
  table:    { color: "#34d399", bg: "#064e3b", border: "#059669", icon: "⬛" },
  join:     { color: "#a78bfa", bg: "#2e1065", border: "#7c3aed", icon: "⟕" },
  where:    { color: "#fb923c", bg: "#431407", border: "#ea580c", icon: "⊘" },
  groupby:  { color: "#38bdf8", bg: "#0c4a6e", border: "#0284c7", icon: "⊞" },
  having:   { color: "#f472b6", bg: "#500724", border: "#db2777", icon: "⊟" },
  orderby:  { color: "#facc15", bg: "#422006", border: "#ca8a04", icon: "↕" },
  select:   { color: "#4ade80", bg: "#052e16", border: "#16a34a", icon: "▶" },
  limit:    { color: "#94a3b8", bg: "#1e293b", border: "#475569", icon: "⊠" },
  subquery: { color: "#c084fc", bg: "#2e1065", border: "#9333ea", icon: "⊡" },
};

interface SqlNodeData {
  type: NodeType;
  label: string;
  detail?: string;
  columns?: string[];
}

export default function SqlNode({ data }: { data: SqlNodeData }) {
  const cfg = NODE_CONFIG[data.type] ?? NODE_CONFIG.table;

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 12,
        minWidth: 160,
        maxWidth: 260,
        boxShadow: `0 0 16px ${cfg.border}44`,
        fontFamily: "var(--font-geist-mono, monospace)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: cfg.border, border: "none", width: 10, height: 10 }}
      />

      {/* Header */}
      <div
        style={{
          background: `${cfg.border}33`,
          borderBottom: `1px solid ${cfg.border}66`,
          padding: "8px 12px",
          borderRadius: "10px 10px 0 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>{cfg.icon}</span>
        <span style={{ color: cfg.color, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
          {data.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "8px 12px 10px" }}>
        {data.detail && (
          <p
            style={{
              color: "#cbd5e1",
              fontSize: 11,
              margin: 0,
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {data.detail}
          </p>
        )}
        {data.columns && data.columns.length > 0 && (
          <div style={{ marginTop: data.detail ? 6 : 0, display: "flex", flexDirection: "column", gap: 2 }}>
            {data.columns.map((col, i) => (
              <span
                key={i}
                style={{
                  color: cfg.color,
                  fontSize: 11,
                  background: `${cfg.border}22`,
                  borderRadius: 4,
                  padding: "1px 6px",
                  display: "inline-block",
                  width: "fit-content",
                }}
              >
                {col}
              </span>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: cfg.border, border: "none", width: 10, height: 10 }}
      />
    </div>
  );
}
