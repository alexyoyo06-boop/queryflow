"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  text: string;
  loading: boolean;
}

export default function ExplainPanel({ text, loading }: Props) {
  return (
    <div
      style={{
        background: "#111827",
        borderTop: "1px solid #1e2d45",
        padding: "12px 16px",
        minHeight: 80,
        maxHeight: 160,
        overflowY: "auto",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: "#3b82f6", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
          AI EXPLANATION
        </span>
        {loading && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#3b82f6",
              display: "inline-block",
              animation: "pulse 1s infinite",
            }}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {text ? (
          <motion.p
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.7, margin: 0 }}
          >
            {text}
            {loading && <span style={{ color: "#3b82f6" }}>▌</span>}
          </motion.p>
        ) : !loading ? (
          <p style={{ color: "#334155", fontSize: 12, margin: 0 }}>
            Click <span style={{ color: "#3b82f6" }}>Visualize</span> to generate an AI explanation of your query.
          </p>
        ) : null}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
