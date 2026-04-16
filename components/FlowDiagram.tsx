"use client";

import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "@dagrejs/dagre";
import { ParseResult } from "@/lib/sql-parser";
import SqlNode from "./SqlNode";

const nodeTypes = { sqlNode: SqlNode };

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

function layoutNodes(
  nodes: { id: string; data: unknown }[],
  edges: { id: string; source: string; target: string }[]
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 80 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}

const EDGE_COLOR = "#334155";

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
      animated: true,
      style: { stroke: "#3b82f6", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
    }));
  }, [result]);

  useEffect(() => {
    if (rfNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const laid = layoutNodes(rfNodes, rfEdges);
    setNodes(laid as Parameters<typeof setNodes>[0]);
    setEdges(rfEdges);
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  if (!result || result.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
        <div style={{ fontSize: 56, opacity: 0.15 }}>⬡</div>
        <p style={{ color: "#334155", fontSize: 14, textAlign: "center", maxWidth: 260 }}>
          Write a SQL query on the left and hit{" "}
          <span style={{ color: "#3b82f6" }}>Visualize</span> to see the flow diagram
        </p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.3}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} color="#1e2d45" gap={24} size={1} />
      <Controls
        style={{ background: "#111827", border: "1px solid #1e2d45", borderRadius: 8 }}
      />
      <MiniMap
        style={{ background: "#111827", border: "1px solid #1e2d45", borderRadius: 8 }}
        nodeColor="#1e3a5f"
        maskColor="#0a0e1a88"
      />
    </ReactFlow>
  );
}
