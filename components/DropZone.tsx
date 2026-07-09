'use client';
import { useRef, useState } from 'react';
import { MdUploadFile, MdPictureAsPdf } from 'react-icons/md';

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
      
      <p style={{ color: 'var(--text-muted)', maxWidth: 360, textAlign: 'center', lineHeight: '1.5' }}>
        Dateien hierher ziehen oder auf den Button unten klicken um zu suchen.<br />
        Unterstützt große Dateien — Rendering ist seitenweise virtualisiert.
      </p>

      {/* Info-Block für das Einfügen aus der Zwischenablage */}
      <div style={{ 
        marginTop: 8,
        padding: '12px 20px',
        background: 'rgba(79, 142, 247, 0.1)',
        border: '1px dashed rgba(79, 142, 247, 0.4)',
        borderRadius: '8px',
        fontSize: '13px',
        color: 'var(--accent, #4f8ef7)',
        maxWidth: '360px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span>💡</span> Tastatur-Shortcut
        </div>
        <div style={{ color: 'var(--text-primary)' }}>
          Kopierte Bilder (z. B. Screenshots) können Sie direkt mit <strong>Strg + V</strong> einfügen.
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
        <button
          className="open-btn"
          onClick={() => inputRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <MdUploadFile /> PDF öffnen
        </button>
      </div>

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
