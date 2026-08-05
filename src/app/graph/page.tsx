'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type cytoscape from 'cytoscape';
import { Header } from '@/components/Header';
import { TripleBadge } from '@/components/TripleBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, RotateCcw, Maximize2, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchGraph, type GraphEdge, type GraphResponse } from '@/lib/api';

// Semantic colour per node label. SideEffect is muted slate so the 347
// Hetionet side-effect nodes don't visually drown out the clinical core
// (Disease / Symptom / Treatment / Criterion). Fixed hex keeps colours
// stable in both themes; node labels use a dark outline so they read on any
// fill.
const LABEL_COLORS: Record<string, string> = {
  ICHD3_Disease: '#be185d',
  ICHD3_Symptom: '#0d9488',
  ICHD3_Criterion: '#0891b2',
  ICHD3_Treatment: '#2563eb',
  ICHD3_TreatmentFormulation: '#3b82f6',
  ICHD3_SideEffect: '#64748b',
  ICHD3_RedFlag: '#dc2626',
  ICHD3_Trigger: '#d97706',
  ICHD3_RiskFactor: '#ea580c',
  ICHD3_Comorbidity: '#7c3aed',
  ICHD3_Mechanism: '#0ea5e9',
  ICHD3_Impact: '#14b8a6',
  ICHD3_EvidenceLevel: '#9333ea',
  ICHD3_Guideline: '#059669',
  NICE_Recommendation: '#4f46e5',
  NICE_Guideline: '#4338ca',
};
const DEFAULT_LABEL_COLOR = '#94a3b8';
const labelColor = (label: string) => LABEL_COLORS[label] ?? DEFAULT_LABEL_COLOR;

const ASSERTION_COLORS_LIGHT: Record<string, string> = {
  present: '#14b8a6',
  absent: '#f0684f',
  possible: '#d9a23a',
};
const ASSERTION_COLORS_DARK: Record<string, string> = {
  present: '#2dd4bf',
  absent: '#fb8a78',
  possible: '#eab86b',
};

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

export default function GraphPage() {
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [labelVisible, setLabelVisible] = useState<Record<string, boolean>>({});
  const [assertionVisible, setAssertionVisible] = useState<Record<string, boolean>>({});
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [edgesMode, setEdgesMode] = useState<'all' | 'none'>('all');

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const isDark = useIsDark();
  const assertionColors = isDark ? ASSERTION_COLORS_DARK : ASSERTION_COLORS_LIGHT;
  const edgeBaseOpacity = isDark ? 0.22 : 0.25;

  // Fetch the whole graph once.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGraph()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLabelVisible(Object.fromEntries(Object.keys(d.stats.label_counts).map((l) => [l, true])));
        setAssertionVisible(
          Object.fromEntries(Object.keys(d.stats.assertion_counts).map((a) => [a, true])),
        );
        setError(null);
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Index lookups.
  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    data?.nodes.forEach((n) => m.set(n.id, n.name));
    return m;
  }, [data]);
  const labelMap = useMemo(() => {
    const m = new Map<string, string>();
    data?.nodes.forEach((n) => m.set(n.id, n.label));
    return m;
  }, [data]);
  const degreeMap = useMemo(() => {
    const m = new Map<string, number>();
    if (!data) return m;
    data.nodes.forEach((n) => m.set(n.id, 0));
    data.edges.forEach((e) => {
      m.set(e.source, (m.get(e.source) ?? 0) + 1);
      m.set(e.target, (m.get(e.target) ?? 0) + 1);
    });
    return m;
  }, [data]);

  const degExtent = useMemo(() => {
    if (!degreeMap.size) return { min: 0, max: 1 };
    let min = Infinity;
    let max = 0;
    degreeMap.forEach((v) => {
      if (v < min) min = v;
      if (v > max) max = v;
    });
    return { min, max };
  }, [degreeMap]);

  const sizeFor = useCallback(
    (deg: number) => {
      const { min, max } = degExtent;
      if (max === min) return 24;
      return 14 + Math.round(((deg - min) / (max - min)) * 34); // 14–48
    },
    [degExtent],
  );

  // Build Cytoscape once when data arrives.
  useEffect(() => {
    if (!data || !containerRef.current) return;
    let destroyed = false;

    async function build() {
      if (!containerRef.current || !data) return;
      const cy = (await import('cytoscape')).default;
      if (destroyed) return;

      const elements: cytoscape.ElementDefinition[] = [
        ...data.nodes.map((n) => ({
          data: {
            id: n.id,
            label: n.name,
            nodeLabel: n.label,
            degree: degreeMap.get(n.id) ?? 0,
          },
        })),
        ...data.edges.map((e, i) => ({
          data: {
            id: `e-${i}`,
            source: e.source,
            target: e.target,
            relType: e.type,
            assertion: e.assertion || 'present',
            sourceRef: e.source_ref || '',
          },
        })),
      ];

      const inst = cy({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              'background-color': (n: cytoscape.NodeSingular) =>
                labelColor(n.data('nodeLabel')),
              color: '#ffffff',
              'font-size': '9px',
              'text-valign': 'center',
              'text-halign': 'center',
              'text-wrap': 'wrap',
              'text-max-width': '70px',
              'text-outline-color': '#0b1115',
              'text-outline-width': 2,
              width: (n: cytoscape.NodeSingular) => sizeFor(n.data('degree')),
              height: (n: cytoscape.NodeSingular) => sizeFor(n.data('degree')),
              'border-width': 1,
              'border-color': '#0b1115',
              'border-opacity': 0.4,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': '#94a3b8',
              'target-arrow-color': '#94a3b8',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 0.6,
              opacity: edgeBaseOpacity,
              label: 'data(relType)',
              'font-size': '7px',
              color: '#94a3b8',
              'text-background-color': isDark ? '#0b1115' : '#ffffff',
              'text-background-opacity': 0.7,
              'text-background-padding': '1px',
              'text-rotation': 'autorotate',
            },
          },
          { selector: '.dimmed', style: { opacity: 0.06, 'transition-property': 'opacity', 'transition-duration': 150 } },
          { selector: '.faded-edge', style: { opacity: 0.04 } },
          { selector: '.bright-edge', style: { opacity: 1, width: 2.5 } },
          { selector: '.selected-node', style: { 'border-width': 3, 'border-color': '#ffffff', 'border-opacity': 1 } },
        ],
        layout: {
          name: 'concentric',
          concentric: (n: cytoscape.NodeSingular) => n.data('degree'),
          levelWidth: () => 1,
          minNodeSpacing: 6,
          fit: true,
          padding: 24,
        } as cytoscape.LayoutOptions,
        wheelSensitivity: 0.2,
      });

      // Colour edges by assertion.
      inst.edges().forEach((edge) => {
        const a = (edge.data('assertion') as string) || 'present';
        const c = assertionColors[a] || assertionColors.present;
        edge.style('line-color', c);
        edge.style('target-arrow-color', c);
      });

      inst.on('tap', 'node', (evt: cytoscape.EventObject) => {
        setSelectedNode(evt.target.id());
      });
      inst.on('tap', (evt: cytoscape.EventObject) => {
        if (evt.target === inst) setSelectedNode(null);
      });

      cyRef.current = inst;
    }

    build();

    return () => {
      destroyed = true;
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
    // Rebuild on theme change so edge label backgrounds and base opacity track the theme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isDark]);

  // Apply filters by showing/hiding elements (keeps layout positions stable).
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !data) return;
    const q = search.trim().toLowerCase();
    const nodeVisible = (id: string) => {
      const label = labelMap.get(id);
      if (label && labelVisible[label] === false) return false;
      if (q) {
        const name = (nameMap.get(id) ?? id).toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    };
    cy.batch(() => {
      cy.nodes().forEach((n) => {
        n.style('display', nodeVisible(n.id()) ? 'element' : 'none');
      });
      cy.edges().forEach((edge) => {
        const sVisible = nodeVisible(edge.data('source') as string);
        const tVisible = nodeVisible(edge.data('target') as string);
        const a = (edge.data('assertion') as string) || 'present';
        const aOk = assertionVisible[a] !== false;
        const sref = edge.data('sourceRef') as string;
        const sOk = !sourceFilter || sref === sourceFilter;
        const edgesOk = edgesMode === 'all';
        edge.style('display', sVisible && tVisible && aOk && sOk && edgesOk ? 'element' : 'none');
      });
    });
  }, [data, search, labelVisible, assertionVisible, sourceFilter, edgesMode, labelMap, nameMap]);

  // Highlight the selected node's neighbourhood.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().removeClass('dimmed faded-edge bright-edge selected-node');
      if (!selectedNode) return;
      const node = cy.getElementById(selectedNode);
      if (!node || node.empty()) return;
      node.addClass('selected-node');
      const hood = node.closedNeighborhood();
      cy.elements().not(hood).addClass('dimmed');
      hood.edges().addClass('bright-edge');
      hood.edges().connectedNodes().not(node).style('opacity', 1);
    });
  }, [selectedNode]);

  const toggleLabel = (l: string) =>
    setLabelVisible((s) => ({ ...s, [l]: s[l] !== false ? false : true }));
  const toggleAssertion = (a: string) =>
    setAssertionVisible((s) => ({ ...s, [a]: s[a] !== false ? false : true }));

  const reset = () => {
    setSearch('');
    setSourceFilter(null);
    setEdgesMode('all');
    if (data) {
      setLabelVisible(Object.fromEntries(Object.keys(data.stats.label_counts).map((l) => [l, true])));
      setAssertionVisible(Object.fromEntries(Object.keys(data.stats.assertion_counts).map((a) => [a, true])));
    }
  };

  const fit = () => cyRef.current?.fit(undefined, 24);

  // Side-panel data for the selected node.
  const selected = useMemo(() => {
    if (!selectedNode || !data) return null;
    const node = data.nodes.find((n) => n.id === selectedNode);
    if (!node) return null;
    const incident = data.edges.filter((e) => e.source === selectedNode || e.target === selectedNode);
    return { node, incident };
  }, [selectedNode, data]);

  const topSources = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.stats.source_ref_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16);
  }, [data]);

  const visibleNodeCount = useMemo(() => {
    if (!data) return 0;
    let c = 0;
    for (const n of data.nodes) {
      if (labelVisible[n.label] === false) continue;
      const q = search.trim().toLowerCase();
      if (q && !n.name.toLowerCase().includes(q)) continue;
      c++;
    }
    return c;
  }, [data, labelVisible, search]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-display-sm tracking-tight text-ink">Knowledge Graph</h1>
            <p className="max-w-3xl text-body-md text-body">
              The whole MigraineAAT-KG knowledge graph: {data ? data.stats.node_count : '—'} nodes and{' '}
              {data ? data.stats.edge_count : '—'} edges, with every edge carrying an assertion
              (present / absent / possible), temporal metadata, and a provenance source. Search,
              filter by type, assertion, or provenance, and click any node to inspect its
              connections.
            </p>
          </div>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 py-16 text-caption text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading the knowledge graph…
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-brand-coral/30 bg-brand-coral/5">
              <CardContent className="py-6 text-body-sm text-body">
                <p className="font-semibold text-brand-coral">Could not load the graph.</p>
                <p className="text-muted">{error}</p>
                <p className="mt-2 text-muted">
                  The backend serves <code>data/processed/neo4j_export_for_pyg.json</code>. Run{' '}
                  <code>make data</code> (and the Hetionet importer if enabled) to build it, then
                  restart the API.
                </p>
              </CardContent>
            </Card>
          )}

          {data && (
            <>
              {/* Schema overview */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Nodes" value={data.stats.node_count} />
                <StatTile label="Edges" value={data.stats.edge_count} />
                <StatTile label="Temporal edges" value={data.stats.temporal_edge_count} />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-caption-uppercase uppercase tracking-wider text-muted">
                      Assertion distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {Object.entries(data.stats.assertion_counts).map(([a, c]) => {
                      const total = data.stats.edge_count;
                      return (
                        <div key={a} className="flex items-center gap-2 text-caption">
                          <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: assertionColors[a] ?? '#94a3b8' }}
                          />
                          <span className="w-16 capitalize text-ink">{a}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-strong">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(c / total) * 100}%`,
                                backgroundColor: assertionColors[a] ?? '#94a3b8',
                              }}
                            />
                          </div>
                          <span className="w-10 text-right font-mono text-muted">{c}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <Card>
                <CardContent className="space-y-4 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[220px] flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search nodes by name…"
                        className="pl-9"
                      />
                    </div>
                    <select
                      value={sourceFilter ?? ''}
                      onChange={(e) => setSourceFilter(e.target.value || null)}
                      className="h-11 rounded-md border border-hairline bg-canvas px-3 text-body-sm text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">All provenance ({data.stats.edge_count})</option>
                      {topSources.map(([s, c]) => (
                        <option key={s} value={s}>
                          {s} ({c})
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={() => setEdgesMode((m) => (m === 'all' ? 'none' : 'all'))}>
                      <Network className="h-4 w-4" />
                      {edgesMode === 'all' ? 'Hide edges' : 'Show edges'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={fit}>
                      <Maximize2 className="h-4 w-4" /> Fit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={reset}>
                      <RotateCcw className="h-4 w-4" /> Reset
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-caption-uppercase uppercase tracking-wider text-muted">
                      Node types ({visibleNodeCount} visible)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(data.stats.label_counts).map(([label, count]) => {
                        const on = labelVisible[label] !== false;
                        return (
                          <button
                            key={label}
                            onClick={() => toggleLabel(label)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-caption transition-colors',
                              on
                                ? 'border-transparent bg-surface-soft text-ink'
                                : 'border-hairline bg-canvas text-muted line-through',
                            )}
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: labelColor(label) }}
                            />
                            {label.replace(/^(ICHD3_|NICE_)/, '')}
                            <span className="font-mono text-muted-soft">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-caption-uppercase uppercase tracking-wider text-muted">
                      Edge assertion
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(data.stats.assertion_counts).map(([a, count]) => {
                        const on = assertionVisible[a] !== false;
                        return (
                          <button
                            key={a}
                            onClick={() => toggleAssertion(a)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-caption capitalize transition-colors',
                              on
                                ? 'border-transparent bg-surface-soft text-ink'
                                : 'border-hairline bg-canvas text-muted line-through',
                            )}
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: assertionColors[a] ?? '#94a3b8' }}
                            />
                            {a}
                            <span className="font-mono text-muted-soft">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Graph + inspector */}
              <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-title-sm text-ink">Graph explorer</CardTitle>
                      <span className="text-caption text-muted">Scroll to zoom · drag to pan · click a node</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative h-[600px] w-full bg-surface-soft">
                      <div ref={containerRef} className="h-full w-full" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-title-sm text-ink">Inspector</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selected ? (
                      <p className="text-caption text-muted">
                        Click a node to inspect it. Its connections appear here with full assertion,
                        temporal, and provenance detail.
                      </p>
                    ) : (
                      <ScrollArea className="h-[540px] pr-3">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: labelColor(selected.node.label) }}
                              />
                              <h3 className="text-title-sm text-ink">{selected.node.name}</h3>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5 text-caption text-muted">
                              <Badge variant="outline" className="text-caption">
                                {selected.node.label.replace(/^(ICHD3_|NICE_)/, '')}
                              </Badge>
                              <Badge variant="outline" className="font-mono text-caption">
                                {degreeMap.get(selected.node.id) ?? 0} edges
                              </Badge>
                              {selected.node.source_ref && (
                                <Badge variant="outline" className="text-caption">
                                  {selected.node.source_ref}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-caption-uppercase uppercase tracking-wider text-muted">
                              Connections ({selected.incident.length})
                            </p>
                            {selected.incident.map((e, i) => (
                              <EdgeRow
                                key={i}
                                edge={e}
                                selectedId={selected.node.id}
                                nameMap={nameMap}
                                labelMap={labelMap}
                              />
                            ))}
                          </div>
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-caption-uppercase uppercase tracking-wider text-muted">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-display-sm text-ink">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function EdgeRow({
  edge,
  selectedId,
  nameMap,
  labelMap,
}: {
  edge: GraphEdge;
  selectedId: string;
  nameMap: Map<string, string>;
  labelMap: Map<string, string>;
}) {
  const isSource = edge.source === selectedId;
  const otherId = isSource ? edge.target : edge.source;
  const otherName = nameMap.get(otherId) ?? otherId;
  const otherLabel = labelMap.get(otherId) ?? '';
  const arrow = isSource ? '→' : '←';
  return (
    <div className="rounded-lg border border-hairline bg-surface-soft p-2 text-caption">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-muted-soft">{arrow}</span>
        <span className="font-semibold text-ink">{edge.type.replace(/_/g, ' ').toLowerCase()}</span>
        <span className="truncate text-body">{otherName}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: labelColor(otherLabel) }}
        />
        <span className="text-muted-soft">{otherLabel.replace(/^(ICHD3_|NICE_)/, '')}</span>
        <TripleBadge assertion={edge.assertion} temporal={edge.temporal} required={edge.required} />
        {edge.source_ref && (
          <span className="ml-auto max-w-[110px] truncate text-[10px] text-muted-soft" title={edge.source_ref}>
            {edge.source_ref}
          </span>
        )}
      </div>
    </div>
  );
}