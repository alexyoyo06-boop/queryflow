"use client";

import { Handle, Position } from "reactflow";
import { NodeType } from "@/lib/sql-parser";

const NODE_CONFIG: Record<NodeType, { accent: string; label: string }> = {
  table:    { accent: "#10b981", label: "FROM" },
  join:     { accent: "#8b5cf6", label: "JOIN" },
  where:    { accent: "#f59e0b", label: "WHERE" },
  groupby:  { accent: "#06b6d4", label: "GROUP BY" },
  having:   { accent: "#ec4899", label: "HAVING" },
  orderby:  { accent: "#64748b", label: "ORDER BY" },
  select:   { accent: "#ff2b2b", label: "SELECT" },
  limit:    { accent: "#475569", label: "LIMIT" },
  subquery: { accent: "#a855f7", label: "SUBQUERY" },
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
    <div style={{
      background: "white",
      border: "2px solid #0a0a0a",
      boxShadow: "3px 3px 0 #0a0a0a",
      minWidth: 220,
      maxWidth: 260,
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
    }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: cfg.accent, border: "2px solid #0a0a0a", width: 10, height: 10, left: -7 }}
      />

      {/* Header */}
      <div style={{
        padding: "6px 12px",
        borderBottom: "2px solid #0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        background: cfg.accent,
      }}>
        <span style={{ color: "white", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "'Space Mono', monospace" }}>
          {cfg.label}
        </span>
        {data.label !== cfg.label && (
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Space Mono', monospace" }}>
            {data.label.replace(cfg.label, "").trim()}
          </span>
        )}
      </div>

      {/* Body */}
      {(data.detail || (data.columns && data.columns.length > 0)) && (
        <div style={{ padding: "8px 12px 10px" }}>
          {data.detail && (
            <p style={{ color: "#555", fontSize: 11, lineHeight: 1.7, wordBreak: "break-word", margin: 0 }}>
              {data.detail}
            </p>
          )}
          {data.columns && data.columns.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: data.detail ? 5 : 0 }}>
              {data.columns.map((col, i) => (
                <span key={i} style={{
                  color: "#0a0a0a",
                  fontSize: 10,
                  background: "#f2f0eb",
                  padding: "2px 6px",
                  border: "1px solid #0a0a0a",
                  fontFamily: "'Space Mono', monospace",
                }}>
                  {col}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: cfg.accent, border: "2px solid #0a0a0a", width: 10, height: 10, right: -7 }}
      />
    </div>
  );
}
