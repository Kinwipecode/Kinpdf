'use client';
import { useRef, useState } from 'react';
import { MdUploadFile, MdPictureAsPdf } from 'react-icons/md';
import { useAppStore } from '@/store/useAppStore';

interface DropZoneProps {
  onFilesLoaded: (files: File[]) => void;
}

export function DropZone({ onFilesLoaded }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfs.length > 0) onFilesLoaded(pdfs);
  };

  return (
    <div
      className={`drop-zone ${isDragOver ? 'drop-zone-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}
    >
      <div className="drop-zone-icon">
        <MdPictureAsPdf style={{ fontSize: 80, color: 'var(--accent)', opacity: 0.6 }} />
      </div>
      <h3>PDF hierher ziehen</h3>
      <p style={{ color: 'var(--text-muted)', maxWidth: 320, textAlign: 'center' }}>
        Dateien hierher ziehen oder auf den Button unten klicken um zu suchen.<br />
        Unterstützt große Dateien — Rendering ist seitenweise virtualisiert.
      </p>
      <button
        className="open-btn"
        onClick={() => inputRef.current?.click()}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <MdUploadFile /> PDF öffnen
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
