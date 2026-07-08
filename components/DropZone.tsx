'use client';
import { useRef, useState } from 'react';
import { MdUploadFile, MdPictureAsPdf, MdLanguage } from 'react-icons/md';
import { useAppStore } from '@/store/useAppStore';

interface DropZoneProps {
  onFilesLoaded: (files: File[]) => void;
}

export function DropZone({ onFilesLoaded }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { openDocument } = useAppStore();
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfs.length > 0) onFilesLoaded(pdfs);
  };

  const handleLoadUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setErrorMsg('');
    
    // Add protocol if missing
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    
    try {
      // Use Microlink screenshot API (it generates high-res screenshot PNG)
      // We request 1600x1200 screenshot
      const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&embed=screenshot.url&viewport.width=1600&viewport.height=1200`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Fehler beim Abrufen des Web-Screenshots.");
      }
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      
      const docName = targetUrl.replace(/^https?:\/\/(www\.)?/, '') + '.png';
      openDocument(docName, localUrl, 1, 'image');
      
      setShowUrlModal(false);
      setUrl('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Die Webseite konnte nicht geladen werden. Bitte überprüfe die URL und versuche es erneut.');
    } finally {
      setLoading(false);
    }
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
      
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        <button
          className="open-btn"
          onClick={() => inputRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <MdUploadFile /> PDF öffnen
        </button>
        <button
          className="open-btn"
          onClick={() => setShowUrlModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e9f6e' }}
        >
          <MdLanguage /> Internetseite öffnen
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

      {showUrlModal && (
        <div className="modal-backdrop" onClick={() => !loading && setShowUrlModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '400px' }}>
            <h3>Internetseite öffnen und bearbeiten</h3>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Erstelle Screenshot der Webseite...</span>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : (
              <form onSubmit={handleLoadUrl} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Web-Adresse (URL):</label>
                  <input
                    type="text"
                    required
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="modal-input"
                    autoFocus
                  />
                </div>
                {errorMsg && (
                  <div style={{ color: '#f87171', fontSize: '12px', background: 'rgba(248,113,113,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                    {errorMsg}
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowUrlModal(false)}>
                    Abbrechen
                  </button>
                  <button type="submit" className="btn-primary" style={{ background: '#0e9f6e' }}>
                    Laden & Konvertieren
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
