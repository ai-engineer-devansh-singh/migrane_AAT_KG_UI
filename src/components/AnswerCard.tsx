'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Database, Download, Info } from 'lucide-react';

interface AnswerCardProps {
  question?: string;
  answer?: string;
  mode?: string;
  retrievalMode?: string | null;
  patientName?: string | null;
  tripleCount?: number;
  retrievalTimeMs?: number;
  llmUsed?: string | null;
  disclaimer?: string;
  loading?: boolean;
  onExport?: () => void;
}

export function AnswerCard({
  question,
  answer,
  mode,
  retrievalMode,
  patientName,
  tripleCount,
  retrievalTimeMs,
  llmUsed,
  disclaimer,
  loading,
  onExport,
}: AnswerCardProps) {
  return (
    <Card className="min-h-[160px]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {question && (
              <p className="text-title-sm text-ink">{question}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-caption text-muted">
              {mode && <Badge variant="outline" className="text-caption">{mode}</Badge>}
              {retrievalMode && (
                <Badge
                  variant="outline"
                  className="text-caption capitalize"
                  title={
                    retrievalMode === 'hybrid'
                      ? 'Answers from established medical knowledge, citing KG facts where they support the answer.'
                      : 'Answers only from retrieved KG facts.'
                  }
                >
                  {retrievalMode}
                </Badge>
              )}
              {patientName && <span>patient: {patientName}</span>}
              {llmUsed && <span>model: {llmUsed}</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-caption text-muted">
            {tripleCount !== undefined && (
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {tripleCount} facts
              </span>
            )}
            {retrievalTimeMs !== undefined && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {retrievalTimeMs.toFixed(0)} ms
              </span>
            )}
            {onExport && !loading && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onExport}
                aria-label="Export this QA session as JSON"
                title="Export session as JSON"
                className="text-muted-soft hover:text-ink"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <>
            {answer ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-body">
                {answer}
              </div>
            ) : (
              <p className="text-body-sm text-muted-soft italic">
                Ask a question to see the generated answer.
              </p>
            )}
            {disclaimer && (
              <Alert className="border-brand-teal/20 bg-brand-teal/10 text-brand-teal">
                <Info className="h-4 w-4 text-brand-teal" />
                <AlertDescription className="text-caption">{disclaimer}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}