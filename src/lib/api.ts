export interface Patient {
  patient_id: string;
  name: string | null;
  profile: string | null;
}

export interface RetrievedFact {
  source?: string;
  source_name: string;
  rel_type: string;
  target?: string;
  target_name: string;
  assertion?: string | null;
  temporal?: string | null;
  required?: boolean | null;
  source_ref?: string | null;
}

export type RetrievalMode = 'hybrid' | 'strict';

export interface QARequest {
  question: string;
  mode: 'public' | 'personal';
  patient_id?: string | null;
  retrieval_mode?: RetrievalMode;
}

export interface QAResponse {
  question: string;
  mode: string;
  patient_id?: string | null;
  retrieval_mode?: string | null;
  answer: string;
  disclaimer: string;
  retrieval: {
    triple_count: number;
    retrieval_time_ms: number;
    top_k_nodes: { node_id: string; index: number; similarity: number }[];
    assertion_filter: string | null;
    temporal_focus: string | null;
  };
  triples: RetrievedFact[];
  llm_used?: string | null;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = API_URL ? `${API_URL}${path}` : path;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchPatients(): Promise<Patient[]> {
  const data = await fetchJson<{ patients: Patient[] }>('/api/patients');
  return data.patients;
}

export async function askQuestion(payload: QARequest): Promise<QAResponse> {
  return fetchJson<QAResponse>('/api/qa', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchHealth(): Promise<{ status: string; neo4j_connected: boolean; version: string }> {
  return fetchJson('/api/health');
}

export interface BenchmarkResponse {
  total_questions: number;
  categories: string[];
  systems: string[];
  questions: {
    id: string;
    category: string;
    mode: string;
    difficulty: string;
    question: string;
    ground_truth: string;
    key_points: string[];
    must_avoid: string[];
    provenance?: string;
  }[];
  summary: {
    mean_scores: Record<string, number | null>;
    statistical_tests: Record<string, unknown>;
  };
  answers: Record<
    string,
    Record<
      string,
      {
        question_id: string;
        system: string;
        answer: string;
        accuracy_score: number | null;
        hallucination_score: number | null;
        evidence_score: number | null;
        safety_score: number | null;
        total_score: number | null;
      }
    >
  >;
}

export async function fetchBenchmark(): Promise<BenchmarkResponse> {
  return fetchJson<BenchmarkResponse>('/api/benchmark');
}

export interface GraphNode {
  id: string;
  name: string;
  label: string;
  source_ref: string | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  assertion: string | null;
  temporal: string | null;
  required: boolean | null;
  source_ref: string | null;
}

export interface GraphSchemaStats {
  node_count: number;
  edge_count: number;
  label_counts: Record<string, number>;
  edge_type_counts: Record<string, number>;
  assertion_counts: Record<string, number>;
  source_ref_counts: Record<string, number>;
  temporal_edge_count: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphSchemaStats;
}

export async function fetchGraph(): Promise<GraphResponse> {
  return fetchJson<GraphResponse>('/api/graph');
}

/** Trigger a browser download for a string blob. */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Flatten the benchmark response into one row per (question, system) pair. */
export function benchmarkToCsv(data: BenchmarkResponse): string {
  const header = [
    'question_id',
    'category',
    'mode',
    'difficulty',
    'provenance',
    'question',
    'ground_truth',
    'system',
    'answer',
    'accuracy_score',
    'hallucination_score',
    'evidence_score',
    'safety_score',
    'total_score',
  ];
  const rows: string[] = [header.join(',')];
  for (const q of data.questions) {
    for (const system of data.systems) {
      const ans = data.answers[system]?.[q.id];
      rows.push(
        [
          q.id,
          q.category,
          q.mode,
          q.difficulty,
          q.provenance ?? 'self',
          q.question,
          q.ground_truth,
          system,
          ans?.answer ?? '',
          ans?.accuracy_score ?? '',
          ans?.hallucination_score ?? '',
          ans?.evidence_score ?? '',
          ans?.safety_score ?? '',
          ans?.total_score ?? '',
        ]
          .map(csvEscape)
          .join(',')
      );
    }
  }
  return rows.join('\n');
}
