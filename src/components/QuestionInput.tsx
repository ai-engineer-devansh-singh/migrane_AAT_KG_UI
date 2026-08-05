'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  disabled?: boolean;
  placeholder?: string;
  variant?: 'default' | 'on-color';
  className?: string;
  /** When provided (with onValueChange), the input is controlled by the parent. */
  value?: string;
  onValueChange?: (value: string) => void;
}

export function QuestionInput({
  onSubmit,
  disabled,
  placeholder,
  variant = 'default',
  className,
  value,
  onValueChange,
}: QuestionInputProps) {
  const [internal, setInternal] = useState('');
  const question = value ?? internal;
  const setQuestion = (v: string) => {
    if (onValueChange) onValueChange(v);
    else setInternal(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  };

  const isOnColor = variant === 'on-color';

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-3', className)}>
      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={placeholder || 'Ask a migraine-related question…'}
        disabled={disabled}
        className={cn(
          'flex-1',
          isOnColor &&
            'border-white/30 bg-white/15 text-white placeholder:text-white/70 focus-visible:border-white focus-visible:ring-white/30'
        )}
      />
      <Button
        type="submit"
        disabled={disabled || !question.trim()}
        variant={isOnColor ? 'on-color' : 'default'}
        className={cn('shrink-0', isOnColor && 'text-ink')}
      >
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        <span className="ml-2 hidden sm:inline">Ask</span>
      </Button>
    </form>
  );
}
