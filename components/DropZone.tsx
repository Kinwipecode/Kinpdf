'use client';
import { useRef, useState, useEffect } from 'react';
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
  
  // Interactive Browser State
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [browserInputUrl, setBrowserInputUrl] = useState('');
  const [iframeSrcDoc, setIframeSrcDoc] = useState('');
  const [captureMode, setCaptureMode] = useState<'viewport' | 'full'>('viewport');
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [iframeScrollTop, setIframeScrollTop] = useState(0);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfs.length > 0) onFilesLoaded(pdfs);
  };

  const loadBrowserPage = async (targetUrl: string) => {
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error();
      let html = await res.text();
      
      // Inject base tag to resolve absolute base path
      const baseTag = `<base href="${targetUrl}">`;
      html = html.replace('<head>', `<head>${baseTag}`);
      
      // Inject a script to intercept link clicks and communicate navigation back to the parent
      const scriptInject = `
        <script>
          // Intercept link clicks to notify parent app
          document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
              const rawHref = link.getAttribute('href');
              if (rawHref) {
                e.preventDefault();
                // Resolve it relative to targetUrl!
                try {
                  const resolvedUrl = new URL(rawHref, document.baseURI).href;
                  window.parent.postMessage({ type: 'NAVIGATE', url: resolvedUrl }, '*');
                } catch (err) {
                  // Fallback to absolute href
                  window.parent.postMessage({ type: 'NAVIGATE', url: link.href }, '*');
                }
              }
            }
          });
          
          // Periodically notify scroll position
          document.addEventListener('scroll', () => {
            window.parent.postMessage({ 
              type: 'SCROLL', 
              scrollTop: window.pageYOffset || document.documentElement.scrollTop 
            }, '*');
          });
        </script>
      `;
      html = html.replace('</body>', `${scriptInject}</body>`);
      setIframeSrcDoc(html);
    } catch (err) {
      // Fallback to direct iframe source if proxy fails
      setIframeSrcDoc('');
    }
  };

  // Listen to postMessage from the iframe proxy
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && typeof e.data === 'object') {
        if (e.data.type === 'NAVIGATE') {
          const newUrl = e.data.url;
          setBrowserUrl(newUrl);
          setBrowserInputUrl(newUrl);
          loadBrowserPage(newUrl);
        } else if (e.data.type === 'SCROLL') {
          setIframeScrollTop(e.data.scrollTop || 0);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleStartBrowsing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    
    setBrowserUrl(targetUrl);
    setBrowserInputUrl(targetUrl);
    setIsBrowsing(true);
    setShowUrlModal(false);
    setUrl('');
    loadBrowserPage(targetUrl);
  };

  const handleCaptureCurrentPage = async () => {
    if (!browserUrl) return;
    setCaptureLoading(true);
    setCaptureError('');
    
    try {
      // Build screenshot URL
      // viewport parameters: width=1600, height=1200
      let apiUrl = `https://api.microlink.io?url=${encodeURIComponent(browserUrl)}&screenshot=true&embed=screenshot.url&viewport.width=1600&viewport.height=1200`;
      
      if (captureMode === 'full') {
        apiUrl += '&screenshot.fullPage=true';
      } else {
        // Scroll to the exact position captured from the iframe
        apiUrl += `&screenshot.scrollTo=${Math.round(iframeScrollTop)}`;
      }
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Fehler beim Abrufen des Web-Screenshots.");
      }
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      
      const docName = browserUrl.replace(/^https?:\/\/(www\.)?/, '') + (captureMode === 'full' ? '_full' : '_viewport') + '.png';
      openDocument(docName, localUrl, 1, 'image');
      
      setIsBrowsing(false);
      setIframeSrcDoc('');
    } catch (err: any) {
      console.error(err);
      setCaptureError('Die Seite konnte nicht konvertiert werden. Bitte versuche es erneut.');
    } finally {
      setCaptureLoading(false);
    }
  };

  if (isBrowsing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: 'calc(100vh - 185px)',
        background: '#1a1a1a',
        color: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        {/* Browser Top Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              setIsBrowsing(false);
              setIframeSrcDoc('');
            }}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
          >
            ← Zurück
          </button>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: '240px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Adresse:</span>
            <input
              type="text"
              value={browserInputUrl}
              onChange={(e) => setBrowserInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  let u = browserInputUrl.trim();
                  if (u) {
                    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
                    setBrowserUrl(u);
                    setBrowserInputUrl(u);
                    loadBrowserPage(u);
                  }
                }
              }}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#111',
                border: '1px solid var(--border)',
                color: '#fff',
                outline: 'none',
                fontSize: '13px'
              }}
            />
            <button
              onClick={() => {
                let u = browserInputUrl.trim();
                if (u) {
                  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
                  setBrowserUrl(u);
                  setBrowserInputUrl(u);
                  loadBrowserPage(u);
                }
              }}
              className="btn-primary"
              style={{ padding: '6px 12px', background: 'var(--accent)' }}
            >
              Öffnen
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={captureMode}
              onChange={(e: any) => setCaptureMode(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#111',
                border: '1px solid var(--border)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="viewport">Aktuelle Ansicht</option>
              <option value="full">Ganze Seite</option>
            </select>
            
            <button
              onClick={handleCaptureCurrentPage}
              disabled={captureLoading}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                background: '#0e9f6e',
                fontWeight: 'bold'
              }}
            >
              {captureLoading ? 'Konvertiere...' : 'In PDF/Bild umwandeln'}
            </button>
          </div>
        </div>

        {/* Browser Iframe Content Area */}
        <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
          {browserUrl ? (
            <iframe
              src={iframeSrcDoc ? undefined : browserUrl}
              srcDoc={iframeSrcDoc || undefined}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#fff'
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-secondary)',
              gap: 8
            }}>
              <span>Gib oben eine Web-Adresse ein und drücke Enter oder Öffnen.</span>
            </div>
          )}
          
          {captureLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              zIndex: 1000
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255,255,255,0.1)',
                borderTopColor: '#0e9f6e',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>
                Wandle Webseite um... Bitte warten...
              </span>
            </div>
          )}
        </div>
        
        {captureError && (
          <div style={{ background: '#f87171', color: '#fff', padding: '8px 16px', fontSize: '13px', textAlign: 'center' }}>
            {captureError}
          </div>
        )}
      </div>
    );
  }

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
        <div className="modal-backdrop" onClick={() => setShowUrlModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '400px' }}>
            <h3>Internetseite öffnen und navigieren</h3>
            <form onSubmit={handleStartBrowsing} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowUrlModal(false)}>
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#0e9f6e' }}>
                  Öffnen & Vorschau
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
