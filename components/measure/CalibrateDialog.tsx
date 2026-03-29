'use client';
import { useState } from 'react';
import type { Point } from '@/types';

interface CalibrateDialogProps {
  linePixelLength: number;
  onConfirm: (realValue: number, unit: string) => void;
  onCancel: () => void;
}

export function CalibrateDialog({ linePixelLength, onConfirm, onCancel }: CalibrateDialogProps) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('mm');

  const handleConfirm = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    onConfirm(num, unit);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Messmaßstab kalibrieren</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
          Geben Sie die tatsächliche Länge der gezeichneten Referenzlinie ein (<strong>{linePixelLength.toFixed(1)} px</strong>).
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Echte Länge
            </label>
            <input
              autoFocus
              type="number"
              step="any"
              className="modal-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>
          <div style={{ width: 100 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Einheit
            </label>
            <select
              className="modal-select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="in">in</option>
              <option value="ft">ft</option>
            </select>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-secondary" onClick={onCancel}>Abbrechen</button>
          <button className="btn-primary" onClick={handleConfirm}>Übernehmen</button>
        </div>
      </div>
    </div>
  );
}
