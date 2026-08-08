'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RetrievedFact {
  source?: string;
  source_name: string;
  rel_type: string;
  target?: string;
  target_name: string;
  assertion?: string | null;
  temporal?: string | null;
  required?: boolean | null;
}

interface TopKNode {
  node_id: string;
  index: number;
  similarity: number;
}

interface SubgraphGraphProps {
  triples: RetrievedFact[];
  topKNodes: TopKNode[];
  onFilterFacts?: (nodeId: string | null) => void;
  className?: string;
}

// Assertion edge colours mirror the TripleBadge palette (present teal, absent
// coral, possible ochre) so the graph and the fact badges read as one system.
// Light values are the originals, dark values brightened to stay visible on a
// dark canvas.
const ASSERTION_COLORS_LIGHT: Record<string, string> = {
  present: '#14b8a6', // teal
  absent: '#f0684f', // brand-coral
  possible: '#d9a23a', // brand-ochre
};
const ASSERTION_COLORS_DARK: Record<string, string> = {
  present: '#2dd4bf',
  absent: '#fb8a78',
  possible: '#eab86b',
};

interface GraphPalette {
  nodeBg: string;
  nodeText: string;
  nodeBorder: string;
  seedBg: string;
  seedText: string;
  seedBorder: string;
  edgeLabelBg: string;
  edgeLabelText: string;
  assertions: Record<string, string>;
}

const PALETTE_LIGHT: GraphPalette = {
  nodeBg: '#94a3b8', // slate-400
  nodeText: '#1e293b',
  nodeBorder: '#e2e8f0',
  seedBg: '#0d9488', // teal-600
  seedText: '#ffffff',
  seedBorder: '#0f172a',
  edgeLabelBg: '#ffffff',
  edgeLabelText: '#475569',
  assertions: ASSERTION_COLORS_LIGHT,
};
const PALETTE_DARK: GraphPalette = {
  nodeBg: '#475569', // slate-600
  nodeText: '#e2e8f0',
  nodeBorder: '#334155',
  seedBg: '#2dd4bf', // teal-400
  seedText: '#0f172a',
  seedBorder: '#0f172a',
  edgeLabelBg: '#0b1115',
  edgeLabelText: '#94a3b8',
  assertions: ASSERTION_COLORS_DARK,
};

// Observe the `dark` class on <html> so the graph re-renders with the right
// palette when the user toggles the theme. The component only mounts after a
// query result exists (client-side, post-mount), so this is safe from SSR.
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export function SubgraphGraph({ triples, topKNodes, onFilterFacts, className }: SubgraphGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef< cytoscape.Core | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const isDark = useIsDark();
  const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT;

  useEffect(() => {
    let destroyed = false;

    async function render() {
      if (!containerRef.current) return;
      const cytoscape = (await import('cytoscape')).default;
      if (destroyed) return;

      const nodes = new Map<
        string,
        { id: string; name: string }
      >();
      const edges: { source: string; target: string; assertion?: string | null; rel_type: string }[] = [];

      triples.forEach((t) => {
        const sourceId = t.source || 'unknown';
        const targetId = t.target || 'unknown';
        nodes.set(sourceId, { id: sourceId, name: t.source_name });
        nodes.set(targetId, { id: targetId, name: t.target_name });
        edges.push({
          source: sourceId,
          target: targetId,
          assertion: t.assertion,
          rel_type: t.rel_type,
        });
      });

      const seedIds = new Set(topKNodes.map((n) => n.node_id));
      const simByNode = new Map(topKNodes.map((n) => [n.node_id, n.similarity]));
      // Map similarity to a node size so stronger retrieval hits read larger.
      const sims = topKNodes.map((n) => n.similarity).filter((v) => typeof v === 'number');
      const simMin = sims.length ? Math.min(...sims) : 0;
      const simMax = sims.length ? Math.max(...sims) : 1;
      const sizeFor = (sim: number | undefined) => {
        if (typeof sim !== 'number' || simMax === simMin) return 42;
        return 36 + Math.round(((sim - simMin) / (simMax - simMin)) * 12); // 36–48
      };

      const elements: cytoscape.ElementDefinition[] = [
        ...Array.from(nodes.values()).map((n) => ({
          data: {
            id: n.id,
            label: n.name,
            isSeed: seedIds.has(n.id),
            similarity: simByNode.get(n.id),
          },
        })),
        ...edges.map((e, idx) => ({
          data: {
            id: `e-${idx}`,
            source: e.source,
            target: e.target,
            assertion: e.assertion || 'present',
            relType: e.rel_type,
          },
        })),
      ];

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              'background-color': palette.nodeBg,
              color: palette.nodeText,
              'font-size': '10px',
              'text-valign': 'center',
              'text-halign': 'center',
              'text-wrap': 'wrap',
              'text-max-width': '80px',
              width: 36,
              height: 36,
              'border-width': 2,
              'border-color': palette.nodeBorder,
            },
          },
          {
            selector: 'node[isSeed]',
            style: {
              'background-color': palette.seedBg,
              color: palette.seedText,
              'border-color': palette.seedBorder,
              'border-width': 3,
              width: 42,
              height: 42,
            },
          },
          {
            // Sized imperatively after layout (see below) since a static
            // stylesheet can't read a per-element numeric ramp.
            selector: 'node[?similarity]',
            style: {
              width: 42,
              height: 42,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 2,
              'line-color': palette.nodeBg,
              'target-arrow-color': palette.nodeBg,
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 0.8,
              label: 'data(relType)',
              'font-size': '8px',
              color: palette.edgeLabelText,
              'text-background-color': palette.edgeLabelBg,
              'text-background-opacity': 0.85,
              'text-background-shape': 'rectangle',
              'text-background-padding': '2px',
            },
          },
          {
            selector: '.dimmed',
            style: {
              opacity: 0.2,
              'transition-property': 'opacity',
              'transition-duration': 200,
            },
          },
        ],
        layout: {
          name: 'cose',
          padding: 10,
          fit: true,
          componentSpacing: 60,
          nodeRepulsion: 400000,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
        },
      });

      // Apply per-edge assertion colors after initial layout.
      cy.edges().forEach((edge) => {
        const assertion = (edge.data('assertion') as string) || 'present';
        edge.style('line-color', palette.assertions[assertion] || palette.assertions.present);
        edge.style('target-arrow-color', palette.assertions[assertion] || palette.assertions.present);
      });

      // Size each seed node by its retrieval similarity so stronger hits read larger.
      cy.nodes().forEach((node) => {
        if (!node.data('isSeed')) return;
        const size = sizeFor(node.data('similarity') as number | undefined);
        node.style({ width: size, height: size });
      });

      cy.on('tap', 'node', (evt: cytoscape.EventObject) => {
        const nodeId = evt.target.id();
        setSelectedNode(nodeId);
        if (onFilterFacts) {
          onFilterFacts(nodeId);
        }
      });

      cy.on('tap', (evt: cytoscape.EventObject) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          if (onFilterFacts) {
            onFilterFacts(null);
          }
        }
      });

      // On hover, dim everything outside the node's closed neighbourhood to
      // emphasise its 1-hop subgraph. Desktop only; tap still drives
      // fact-filtering on touch devices.
      cy.on('mouseover', 'node', (evt: cytoscape.EventObject) => {
        const node = evt.target;
        cy.elements().not(node.closedNeighborhood()).addClass('dimmed');
      });
      cy.on('mouseout', 'node', () => {
        cy.elements().removeClass('dimmed');
      });

      cyRef.current = cy;
      setLoading(false);
    }

    render();

    return () => {
      destroyed = true;
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
    // Re-render when the theme flips so node/edge colours track the palette.
  }, [triples, topKNodes, onFilterFacts, palette]);

  // Map node ids to display names for the retrieval ranking list.
  const nodeName = (id: string) => {
    for (const t of triples) {
      if (t.source === id) return t.source_name;
      if (t.target === id) return t.target_name;
    }
    return id;
  };
  const rankedSeeds = [...topKNodes].sort((a, b) => b.similarity - a.similarity);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-caption-uppercase uppercase tracking-wider text-ink">
            Retrieved subgraph
          </CardTitle>
          {selectedNode && (
            <Badge variant="outline" className="text-caption">
              Filtering: {selectedNode}
            </Badge>
          )}
        </div>
        <p className="text-caption text-muted">
          Teal nodes are retrieval seeds (sized by similarity). Hover to highlight a
          neighbourhood; click a node to filter facts below.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[300px] w-full bg-surface-soft">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-caption text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading graph…
            </div>
          )}
          <div ref={containerRef} className="h-full w-full" />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-hairline p-3 text-caption">
          <span className="font-semibold text-ink">Assertion:</span>
          {Object.entries(palette.assertions).map(([assertion, color]) => (
            <span key={assertion} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {assertion}
            </span>
          ))}
        </div>
        {rankedSeeds.length > 0 && (
          <div className="border-t border-hairline p-3">
            <p className="mb-1 text-caption font-semibold text-ink">
              Retrieval ranking (learned similarity)
            </p>
            <ol className="space-y-0.5 text-caption text-body">
              {rankedSeeds.map((n) => (
                <li key={n.node_id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">
                    <span className="text-muted-soft">{n.index + 1}.</span> {nodeName(n.node_id)}
                  </span>
                  <span className="shrink-0 font-mono text-muted">{n.similarity.toFixed(3)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
