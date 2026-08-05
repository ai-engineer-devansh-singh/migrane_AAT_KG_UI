'use client';

import { Patient } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PatientSelectorProps {
  patients: Patient[];
  selected: string | null;
  onSelect: (patientId: string) => void;
  disabled?: boolean;
}

export function PatientSelector({ patients, selected, onSelect, disabled }: PatientSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-body-sm text-body">Patient:</span>
      <Select
        value={selected || ''}
        onValueChange={(value) => value && onSelect(value)}
        disabled={disabled || patients.length === 0}
      >
        <SelectTrigger className="w-[220px] text-body-md">
          <SelectValue placeholder="Select patient" />
        </SelectTrigger>
        <SelectContent>
          {patients.map((p) => (
            <SelectItem key={p.patient_id} value={p.patient_id}>
              {p.name || p.patient_id}
              {p.profile ? ` — ${p.profile}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
