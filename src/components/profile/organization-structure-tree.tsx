"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

export type PublicStructureItem = {
  id: string;
  content: string;
};

export type PublicStructureNode = {
  id: string;
  label: string;
  nodeType: "primary" | "standard" | "leaf";
  items: PublicStructureItem[];
};

export type PublicStructureEdge = { parentId: string; childId: string };

export type PublicStructureLayout = {
  levels: PublicStructureNode[][];
  edges: PublicStructureEdge[];
};

function StructureBox({ node, compact }: { node: PublicStructureNode; compact?: boolean }) {
  if (node.nodeType === "leaf" && node.items.length === 0) {
    return (
      <div
        className={`org-chart-level flex w-full items-center justify-center rounded-xl border-2 border-[#18130E] bg-[#FEFDF9] text-center font-bold leading-5 text-[#18130E] shadow-[4px_4px_0_#DDD5C3] transition duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_#C9BFA8] ${
          compact ? "min-h-16 px-3 py-3 text-[11px]" : "min-h-20 px-4 py-4 text-xs"
        }`}
      >
        <span>{node.label}</span>
      </div>
    );
  }

  const isPrimary = node.nodeType === "primary";

  return (
    <div
      className={`org-chart-level relative w-full rounded-[1.5rem] border-2 border-[#18130E] bg-[#FEFDF9] shadow-[7px_7px_0_#DDD5C3] transition duration-300 hover:-translate-y-1 hover:shadow-[9px_9px_0_#C9BFA8] ${
        isPrimary ? "max-w-2xl px-7 py-7 sm:px-9" : "max-w-md px-7 py-7"
      }`}
    >
      <h3
        className={`mx-auto -mt-12 w-fit rounded-2xl bg-[#18130E] text-center font-black uppercase text-white shadow-[4px_4px_0_#DDD5C3] ${
          isPrimary ? "px-6 py-2.5 text-xs tracking-[0.2em]" : "px-5 py-2.5 text-[11px] tracking-[0.16em]"
        }`}
      >
        {node.label}
      </h3>
      {node.items.length > 0 ? (
        <div className="mt-4 space-y-2 text-center text-sm leading-6 text-[#6B5E52] sm:text-base">
          {node.items.map((item) => (
            <p key={item.id}>{item.content}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type RenderItem =
  | { kind: "node"; id: string; node: PublicStructureNode }
  | { kind: "cluster"; id: string; parentId: string; nodes: PublicStructureNode[] };

type RenderEdge = { id: string; parentId: string; childId: string };

// Same-parent leaf siblings with no content of their own (e.g. "Urusan
// Akademik", "Urusan Kehumasan", ...) get grouped into ONE wrapper box with
// its own internal grid, connected to the parent by a single line, instead
// of N separate boxes each needing their own connector. A row of many
// individually-connected siblings either needs a cramped horizontal scroll
// to stay literally side-by-side, or (if allowed to wrap) produces
// ambiguous-looking connectors once it spans more than one visual line —
// grouping sidesteps both: the wrapper's internal grid can wrap freely with
// uniform spacing, and there's only ever one unambiguous edge into it.
function buildRenderRows(layout: PublicStructureLayout): { rows: RenderItem[][]; edges: RenderEdge[] } {
  const parentsOf = new Map<string, string[]>();
  layout.edges.forEach((edge) => {
    parentsOf.set(edge.childId, [...(parentsOf.get(edge.childId) ?? []), edge.parentId]);
  });

  const edges: RenderEdge[] = [];

  const rows = layout.levels.map((row) => {
    const groupableByParent = new Map<string, PublicStructureNode[]>();
    row.forEach((node) => {
      const parents = parentsOf.get(node.id) ?? [];
      const isGroupable = node.nodeType === "leaf" && node.items.length === 0 && parents.length === 1;
      if (!isGroupable) return;
      const list = groupableByParent.get(parents[0]) ?? [];
      list.push(node);
      groupableByParent.set(parents[0], list);
    });

    const emittedClusterParents = new Set<string>();
    const items: RenderItem[] = [];

    row.forEach((node) => {
      const parents = parentsOf.get(node.id) ?? [];
      const group = parents.length === 1 ? groupableByParent.get(parents[0]) : undefined;
      const isClustered = node.nodeType === "leaf" && node.items.length === 0 && group && group.length >= 2;

      if (isClustered) {
        const parentId = parents[0];
        if (emittedClusterParents.has(parentId)) return;
        emittedClusterParents.add(parentId);

        const clusterId = `cluster-${parentId}`;
        items.push({ kind: "cluster", id: clusterId, parentId, nodes: group! });
        edges.push({ id: `${parentId}->${clusterId}`, parentId, childId: clusterId });
        return;
      }

      items.push({ kind: "node", id: node.id, node });
      parents.forEach((parentId) => {
        edges.push({ id: `${parentId}->${node.id}`, parentId, childId: node.id });
      });
    });

    return items;
  });

  return { rows, edges };
}

type Point = { x: number; y: number };
type ConnectorLine = { id: string; from: Point; to: Point; stemY: number };

const CONNECTOR_STEM_OFFSET = 20;

export function OrganizationStructureTree({ layout }: { layout: PublicStructureLayout }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef(new Map<string, HTMLDivElement>());
  const [lines, setLines] = useState<ConnectorLine[]>([]);

  const { rows, edges } = useMemo(() => buildRenderRows(layout), [layout]);

  useLayoutEffect(() => {
    function recompute() {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();

      const centerBottomOf = (id: string): Point | null => {
        const el = boxRefs.current.get(id);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - containerRect.left, y: rect.bottom - containerRect.top };
      };
      const centerTopOf = (id: string): Point | null => {
        const el = boxRefs.current.get(id);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - containerRect.left, y: rect.top - containerRect.top };
      };

      const nextLines = edges
        .map((edge) => {
          const from = centerBottomOf(edge.parentId);
          const to = centerTopOf(edge.childId);
          if (!from || !to) return null;
          return {
            id: edge.id,
            from,
            to,
            stemY: to.y - CONNECTOR_STEM_OFFSET,
          };
        })
        .filter((line): line is ConnectorLine => line !== null);

      setLines(nextLines);
    }

    recompute();

    const container = containerRef.current;
    const observer = new ResizeObserver(recompute);
    if (container) observer.observe(container);
    window.addEventListener("resize", recompute);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [edges]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative mx-auto flex max-w-5xl flex-col items-center gap-9">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {lines.map(({ id, from, to, stemY }) => (
          <path
            key={id}
            d={`M ${from.x} ${from.y} L ${from.x} ${stemY} L ${to.x} ${stemY} L ${to.x} ${to.y}`}
            fill="none"
            stroke="#C9BFA8"
            strokeWidth={1}
          />
        ))}
      </svg>

      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex w-full flex-wrap justify-center gap-5 sm:gap-8">
          {row.map((item) =>
            item.kind === "cluster" ? (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) boxRefs.current.set(item.id, el);
                  else boxRefs.current.delete(item.id);
                }}
                className="relative w-full max-w-2xl grow shrink-0 basis-72 rounded-[1.5rem] border-2 border-dashed border-[#C9BFA8] bg-[#FBF8F2] p-4"
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {item.nodes.map((node) => (
                    <StructureBox key={node.id} node={node} compact />
                  ))}
                </div>
              </div>
            ) : (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) boxRefs.current.set(item.id, el);
                  else boxRefs.current.delete(item.id);
                }}
                className={
                  item.node.nodeType === "leaf"
                    ? "relative min-w-[140px] max-w-[220px] grow shrink-0 basis-40"
                    : "relative min-w-[260px] max-w-md grow shrink-0 basis-72"
                }
              >
                <StructureBox node={item.node} />
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}
