import { Parser } from "node-sql-parser";

export type NodeType =
  | "table"
  | "join"
  | "where"
  | "groupby"
  | "having"
  | "orderby"
  | "select"
  | "limit"
  | "subquery";

export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  detail?: string;
  columns?: string[];
}

export interface FlowEdge {
  from: string;
  to: string;
}

export interface ParseResult {
  nodes: FlowNode[];
  edges: FlowEdge[];
  error?: string;
}

const parser = new Parser();

function colToStr(col: unknown): string {
  if (!col || typeof col !== "object") return String(col ?? "");
  const c = col as Record<string, unknown>;
  if (c.type === "star") return "*";
  if (c.type === "aggr_func") {
    const args = c.args as Record<string, unknown> | undefined;
    const inner = args?.expr ? colToStr(args.expr) : "*";
    return `${c.name}(${inner})`;
  }
  if (c.type === "column_ref") {
    const table = c.table ? `${c.table}.` : "";
    return `${table}${c.column}`;
  }
  if (c.type === "binary_expr") {
    return `${colToStr(c.left)} ${c.operator} ${colToStr(c.right)}`;
  }
  if (c.type === "number" || c.type === "string") return String(c.value);
  if (c.column) return String(c.column);
  return JSON.stringify(col).slice(0, 30);
}

function exprToStr(expr: unknown, depth = 0): string {
  if (!expr || typeof expr !== "object") return String(expr ?? "");
  const e = expr as Record<string, unknown>;
  if (e.type === "binary_expr") {
    if (depth > 1) return "...";
    return `${exprToStr(e.left, depth + 1)} ${e.operator} ${exprToStr(e.right, depth + 1)}`;
  }
  if (e.type === "column_ref") {
    const table = e.table ? `${e.table}.` : "";
    return `${table}${e.column}`;
  }
  if (e.type === "number" || e.type === "string") return String(e.value);
  if (e.type === "aggr_func") return colToStr(expr);
  return String(e.value ?? e.column ?? "expr");
}

function tableToStr(t: unknown): string {
  if (!t || typeof t !== "object") return String(t ?? "");
  const tbl = t as Record<string, unknown>;
  const name = String(tbl.table ?? tbl.name ?? "?");
  const alias = tbl.as ? ` AS ${tbl.as}` : "";
  return `${name}${alias}`;
}

export function parseSQL(sql: string): ParseResult {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let idCounter = 0;
  const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

  let ast: Record<string, unknown>;
  try {
    const result = parser.astify(sql);
    ast = (Array.isArray(result) ? result[0] : result) as unknown as Record<string, unknown>;
  } catch {
    return { nodes: [], edges: [], error: "Invalid SQL syntax. Check your query and try again." };
  }

  if (ast.type !== "select") {
    return { nodes: [], edges: [], error: "Only SELECT queries are supported for now." };
  }

  // --- FROM / tables ---
  const fromList = ast.from as unknown[] | null;
  const tableNodeIds: string[] = [];

  if (fromList && fromList.length > 0) {
    fromList.forEach((f) => {
      const tbl = f as Record<string, unknown>;
      if (tbl.expr) {
        // subquery
        const subId = nextId("subquery");
        nodes.push({ id: subId, type: "subquery", label: "Subquery", detail: tbl.as ? `AS ${tbl.as}` : undefined });
        tableNodeIds.push(subId);
      } else if (tbl.join) {
        // handled in joins
      } else {
        const tableId = nextId("table");
        nodes.push({ id: tableId, type: "table", label: tableToStr(f) });
        tableNodeIds.push(tableId);
      }
    });
  }

  // --- JOINs ---
  const joinNodeIds: string[] = [];
  if (fromList && fromList.length > 0) {
    fromList.forEach((f) => {
      const tbl = f as Record<string, unknown>;
      if (tbl.join) {
        const joinId = nextId("join");
        const joinTable = tableToStr(f);
        const onExpr = tbl.on ? exprToStr(tbl.on) : "";
        nodes.push({
          id: joinId,
          type: "join",
          label: `${tbl.join || "JOIN"} ${joinTable}`,
          detail: onExpr ? `ON ${onExpr}` : undefined,
        });
        joinNodeIds.push(joinId);
      }
    });
  }

  // --- Chain: tables → joins → ... ---
  let lastIds: string[] = [...tableNodeIds];

  if (joinNodeIds.length > 0) {
    // connect first table to first join
    if (tableNodeIds.length > 0) {
      edges.push({ from: tableNodeIds[0], to: joinNodeIds[0] });
    }
    joinNodeIds.forEach((jId, i) => {
      if (i < joinNodeIds.length - 1) edges.push({ from: jId, to: joinNodeIds[i + 1] });
    });
    lastIds = [joinNodeIds[joinNodeIds.length - 1]];
  }

  // --- WHERE ---
  if (ast.where) {
    const whereId = nextId("where");
    const detail = exprToStr(ast.where);
    nodes.push({ id: whereId, type: "where", label: "WHERE", detail });
    lastIds.forEach((id) => edges.push({ from: id, to: whereId }));
    lastIds = [whereId];
  }

  // --- GROUP BY ---
  const groupby = ast.groupby as unknown[] | null;
  if (groupby && groupby.length > 0) {
    const gbId = nextId("groupby");
    const cols = groupby.map(colToStr).join(", ");
    nodes.push({ id: gbId, type: "groupby", label: "GROUP BY", detail: cols });
    lastIds.forEach((id) => edges.push({ from: id, to: gbId }));
    lastIds = [gbId];
  }

  // --- HAVING ---
  if (ast.having) {
    const havingId = nextId("having");
    nodes.push({ id: havingId, type: "having", label: "HAVING", detail: exprToStr(ast.having) });
    lastIds.forEach((id) => edges.push({ from: id, to: havingId }));
    lastIds = [havingId];
  }

  // --- ORDER BY ---
  const orderby = ast.orderby as unknown[] | null;
  if (orderby && orderby.length > 0) {
    const obId = nextId("orderby");
    const detail = orderby
      .map((o) => {
        const ob = o as Record<string, unknown>;
        return `${colToStr(ob.expr)} ${ob.type ?? "ASC"}`;
      })
      .join(", ");
    nodes.push({ id: obId, type: "orderby", label: "ORDER BY", detail });
    lastIds.forEach((id) => edges.push({ from: id, to: obId }));
    lastIds = [obId];
  }

  // --- LIMIT ---
  const limit = ast.limit as Record<string, unknown> | null;
  if (limit) {
    const limitId = nextId("limit");
    const val = (limit.value as unknown[])?.map((v) => (v as Record<string, unknown>).value).join(", ") ?? "";
    nodes.push({ id: limitId, type: "limit", label: "LIMIT", detail: val });
    lastIds.forEach((id) => edges.push({ from: id, to: limitId }));
    lastIds = [limitId];
  }

  // --- SELECT (output) ---
  const columns = ast.columns as unknown[] | "star" | null;
  const selectId = nextId("select");
  let colList: string[] = [];
  if (columns === "star" || columns === null) {
    colList = ["*"];
  } else if (Array.isArray(columns)) {
    colList = columns.map((c) => {
      const col = c as Record<string, unknown>;
      const alias = col.as ? ` AS ${col.as}` : "";
      return `${colToStr(col.expr)}${alias}`;
    });
  }
  nodes.push({ id: selectId, type: "select", label: "SELECT", columns: colList });
  lastIds.forEach((id) => edges.push({ from: id, to: selectId }));

  return { nodes, edges };
}
