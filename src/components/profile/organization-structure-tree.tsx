export type PublicStructureItem = {
  id: string;
  content: string;
};

export type PublicStructureNode = {
  id: string;
  label: string;
  nodeType: "primary" | "standard" | "leaf";
  items: PublicStructureItem[];
  children: PublicStructureNode[];
};

function isLeafRow(nodes: PublicStructureNode[]) {
  return nodes.every((node) => node.nodeType === "leaf" && node.children.length === 0);
}

function StructureBox({ node }: { node: PublicStructureNode }) {
  if (node.nodeType === "leaf" && node.items.length === 0) {
    return (
      <div className="org-chart-level flex min-h-20 w-full items-center justify-center rounded-xl border-2 border-[#18130E] bg-[#FEFDF9] px-4 py-4 text-center text-xs font-bold leading-5 text-[#18130E] shadow-[4px_4px_0_#DDD5C3] transition duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_#C9BFA8]">
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

function StructureNode({ node }: { node: PublicStructureNode }) {
  return (
    <div className="mt-5 flex w-full flex-col items-center">
      <StructureBox node={node} />
      <StructureChildren nodes={node.children} />
    </div>
  );
}

function StructureChildren({ nodes }: { nodes: PublicStructureNode[] }) {
  if (nodes.length === 0) {
    return null;
  }

  const asLeafRow = isLeafRow(nodes);

  return (
    <>
      <span className="h-9 w-px bg-[#C9BFA8]" aria-hidden="true" />

      {asLeafRow ? (
        <div
          className="grid w-full gap-3 sm:gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
        >
          {nodes.map((node) => (
            <div key={node.id} className="relative flex pt-3 sm:pt-9">
              <span
                className="absolute left-1/2 top-0 hidden h-9 w-px -translate-x-1/2 bg-[#C9BFA8] sm:block"
                aria-hidden="true"
              />
              <StructureNode node={node} />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative w-full">
          {nodes.length > 1 ? (
            <span
              className="absolute left-[15%] right-[15%] top-0 hidden h-px bg-[#C9BFA8] sm:block"
              aria-hidden="true"
            />
          ) : null}
          <div className="flex flex-wrap justify-center gap-5 sm:gap-8 sm:pt-9">
            {nodes.map((node) => (
              <div key={node.id} className="relative min-w-[260px] max-w-md flex-1 basis-72">
                {nodes.length > 1 ? (
                  <span
                    className="absolute left-1/2 -top-9 hidden h-9 w-px -translate-x-1/2 bg-[#C9BFA8] sm:block"
                    aria-hidden="true"
                  />
                ) : null}
                <StructureNode node={node} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function OrganizationStructureTree({ roots }: { roots: PublicStructureNode[] }) {
  if (roots.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center">
      {roots.map((root) => (
        <StructureNode key={root.id} node={root} />
      ))}
    </div>
  );
}
