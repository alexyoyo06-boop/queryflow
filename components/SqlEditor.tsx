"use client";

import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

const lightTheme = createTheme({
  theme: "light",
  settings: {
    background: "white",
    foreground: "#0a0a0a",
    caret: "#ff2b2b",
    selection: "#0a0a0a20",
    selectionMatch: "#0a0a0a15",
    lineHighlight: "#f8f7f4",
    gutterBackground: "#f2f0eb",
    gutterForeground: "#aaa",
    gutterBorder: "#e0ddd8",
    fontFamily: "'Space Mono', monospace",
  },
  styles: [
    { tag: t.keyword, color: "#ff2b2b", fontWeight: "700" },
    { tag: t.string, color: "#10b981" },
    { tag: t.number, color: "#f59e0b" },
    { tag: t.operator, color: "#8b5cf6" },
    { tag: t.comment, color: "#bbb" },
    { tag: t.name, color: "#0a0a0a" },
    { tag: t.typeName, color: "#ff2b2b" },
    { tag: t.function(t.name), color: "#ec4899" },
    { tag: t.special(t.name), color: "#ff2b2b" },
    { tag: t.punctuation, color: "#666" },
  ],
});

const lineHeight = EditorView.theme({
  ".cm-content": { padding: "14px 0", lineHeight: "1.8" },
  ".cm-line": { padding: "0 16px" },
  ".cm-gutters": { paddingRight: "8px" },
  ".cm-editor": { height: "100%" },
  ".cm-scroller": { overflow: "auto" },
});

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function SqlEditor({ value, onChange }: Props) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[sql(), lineHeight]}
      theme={lightTheme}
      style={{ height: "100%", fontSize: 13 }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        syntaxHighlighting: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        highlightActiveLine: true,
      }}
    />
  );
}
