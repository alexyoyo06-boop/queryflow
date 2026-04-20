"use client";

import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { ParseResult, NodeType } from "@/lib/sql-parser";
import SqlNode from "./SqlNode";

const nodeTypes = { sqlNode: SqlNode };

const NODE_W = 240;
const NODE_H = 110;
const COL_GAP = 140;
const ROW_GAP = 30;

// Group node types into 3 columns
const COLUMN: Record<NodeType, 0 | 1 | 2> = {
  table:    0,
  subquery: 0,
  join:     0,
  where:    1,
  groupby:  1,
  having:   1,
  orderby:  2,
  limit:    2,
  select:   2,
};

function layoutNodes(nodes: { id: string; type: string; data: unknown }[]) {
  // Separate into 3 columns
  const cols: { id: string; type: string; data: unknown }[][] = [[], [], []];

  nodes.forEach((n) => {
    const d = n.data as { type: NodeType };
    const col = COLUMN[d.type] ?? 1;
    cols[col].push(n);
  });

  const positioned: { id: string; type: string; data: unknown; position: { x: number; y: number } }[] = [];

  cols.forEach((col, colIdx) => {
    const totalHeight = col.length * NODE_H + (col.length - 1) * ROW_GAP;
    const startY = -totalHeight / 2;
    col.forEach((node, rowIdx) => {
      positioned.push({
        ...node,
        position: {
          x: colIdx * (NODE_W + COL_GAP),
          y: startY + rowIdx * (NODE_H + ROW_GAP),
        },
      });
    });
  });

  return positioned;
}

interface Props {
  result: ParseResult | null;
}

export default function FlowDiagram({ result }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const rfNodes = useMemo(() => {
    if (!result || result.nodes.length === 0) return [];
    return result.nodes.map((n) => ({
      id: n.id,
      type: "sqlNode",
      data: { type: n.type, label: n.label, detail: n.detail, columns: n.columns },
      position: { x: 0, y: 0 },
    }));
  }, [result]);

  const rfEdges = useMemo(() => {
    if (!result) return [];
    return result.edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.from,
      target: e.to,
      type: "smoothstep",
      animated: false,
      style: { stroke: "#0a0a0a", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#0a0a0a" },
    }));
  }, [result]);

  useEffect(() => {
    if (rfNodes.length === 0) { setNodes([]); setEdges([]); return; }
    const laid = layoutNodes(rfNodes);
    setNodes(laid as Parameters<typeof setNodes>[0]);
    setEdges(rfEdges);
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  if (!result || result.nodes.length === 0) return null;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.2 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      style={{ background: "transparent" }}
    >
      <Background variant={BackgroundVariant.Dots} color="transparent" />
      <Controls
        showInteractive={false}
        style={{
          background: "white",
          border: "2px solid #0a0a0a",
          borderRadius: 0,
          boxShadow: "3px 3px 0 #0a0a0a",
        }}
      />
    </ReactFlow>
  );
}
