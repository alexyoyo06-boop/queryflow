"use client";

interface Props {
  text: string;
  loading: boolean;
}

export default function ExplainPanel({ text, loading }: Props) {
  if (!text && !loading) return null;

  return (
    <div style={{
      borderTop: "2px solid #0a0a0a",
      background: "#f2f0eb",
      padding: "10px 16px 12px",
      maxHeight: 140,
      overflowY: "auto",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", color: "#ff2b2b", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>AI</span>
        <span style={{ color: "#ccc", fontSize: 10 }}>──────</span>
        {loading && (
          <span style={{
            display: "inline-block",
            width: 5,
            height: 5,
            background: "#ff2b2b",
            animation: "blink 1s infinite",
          }} />
        )}
      </div>
      <p style={{
        color: "#555",
        fontSize: 11,
        lineHeight: 1.8,
        letterSpacing: "0.02em",
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        {text}
        {loading && <span style={{ color: "#ff2b2b", marginLeft: 2 }}>▌</span>}
      </p>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
    </div>
  );
}
