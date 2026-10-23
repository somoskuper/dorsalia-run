'use client';

import React, { useId, useRef, useState } from 'react';
import { formatDateDisplay, parseDateDisplay, sanitizeDateTyping } from '@/lib/dateInput';

type Props = {
  name?: string;
  value: string;
  onChange: (isoDate: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  'aria-label'?: string;
};

/** Text date field (dd/mm/aaaa) — avoids native type=date keyboard bugs. */
export function DateField({
  name,
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = 'dd/mm/aaaa',
  required,
  id,
  'aria-label': ariaLabel,
}: Props) {
  const autoId = useId();
  const inputId = id || autoId;
  const pickerRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft !== null ? draft : formatDateDisplay(value);

  const commit = (raw: string) => {
    if (!raw.trim()) {
      onChange('');
      setDraft(null);
      return;
    }
    const parsed = parseDateDisplay(raw);
    if (!parsed) {
      setDraft(sanitizeDateTyping(raw));
      return;
    }
    onChange(parsed);
    setDraft(null);
  };

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.click();
    }
  };

  return (
    <div className="relative">
      <input
        id={inputId}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        spellCheck={false}
        required={required}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={className}
        value={shown}
        onFocus={() => setDraft(formatDateDisplay(value) || '')}
        onChange={(e) => {
          const raw = sanitizeDateTyping(e.target.value);
          setDraft(raw);
          if (raw.replace(/\D/g, '').length === 8) {
            const parsed = parseDateDisplay(raw);
            if (parsed) onChange(parsed);
          }
        }}
        onBlur={(e) => {
          if (draft != null) commit(draft);
          onBlur?.(e);
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Abrir calendario"
        onClick={openPicker}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-current/50 hover:text-current"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value || '');
          setDraft(null);
        }}
        className="sr-only absolute opacity-0 pointer-events-none w-0 h-0"
      />
    </div>
  );
}
