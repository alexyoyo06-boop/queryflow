"use client";

import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

const customTheme = EditorView.theme({
  "&": {
    background: "#111827 !important",
    fontSize: "13px",
    fontFamily: "var(--font-geist-mono, monospace)",
  },
  ".cm-content": { padding: "12px 0" },
  ".cm-gutters": { background: "#0f172a", border: "none", color: "#334155" },
  ".cm-activeLine": { background: "#1e2d4544" },
  ".cm-cursor": { borderLeftColor: "#3b82f6" },
  ".cm-selectionBackground": { background: "#1e3a5f !important" },
});

export default function SqlEditor({ value, onChange }: Props) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[sql(), customTheme]}
      theme={oneDark}
      style={{ height: "100%", overflow: "auto" }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: true,
        syntaxHighlighting: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        highlightActiveLine: true,
      }}
    />
  );
}
