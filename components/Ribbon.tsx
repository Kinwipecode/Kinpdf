'use client';
import { useState, useRef, useEffect } from 'react';
import {
  MdHighlight, MdComment, MdTextFields, MdFormatColorFill,
  MdZoomIn, MdZoomOut, MdFitScreen, MdDelete, MdHistory,
  MdPanTool, MdSelectAll, MdCropFree, MdRotateRight, MdVisibility,
  MdVisibilityOff, MdViewSidebar, MdGesture,
  MdOutlineCleaningServices, MdOutlineSquare, MdOutlineCircle,
  MdHorizontalRule, MdArrowForward, MdSyncAlt, MdEdit,
  MdOpacity, MdUndo, MdRedo, MdTimeline, MdArrowDropDown,
  MdArrowRightAlt, MdStraight, MdFolderOpen, MdSave, MdPrint,
  MdTrendingUp, MdShortcut, MdArrowRight, MdCalculate, MdFunctions,
  MdAddBox, MdDeleteSweep, MdArrowUpward, MdArrowDownward, MdContentCopy
} from 'react-icons/md';
import { BsVectorPen } from 'react-icons/bs';
import { BiEraser } from 'react-icons/bi';
import { TbRulerMeasure, TbLasso } from 'react-icons/tb';
import { useAppStore, useActiveDocument } from '@/store/useAppStore';
import type { ToolType } from '@/types';
import { OCRButton } from './OCRButton';
import { ColorPicker } from './ColorPicker';
import { downloadPdfWithAnnotations } from '@/lib/pdfExport';


const RIBBON_TABS = ['Start', 'Ansicht', 'Bearbeiten', 'Zeichnen', 'Messen', 'Seiten'] as const;
type RibbonTab = typeof RIBBON_TABS[number];

interface ToolBtnProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  tool?: ToolType;
  onClick?: () => void;
  active?: boolean;
  tooltip?: string;
}

function ToolBtn({ icon, label, shortcut, tool, onClick, active, tooltip }: ToolBtnProps) {
  const { activeTool, setActiveTool } = useAppStore();
  const isActive = active ?? (tool ? activeTool === tool : false);

  const handleClick = () => {
    if (tool) {
      if (activeTool === tool) {
        setActiveTool('hand');
      } else {
        setActiveTool(tool);
      }
    }
    onClick?.();
  };

  return (
    <button
      className={`ribbon-btn group flex flex-col items-center justify-center p-2 rounded-md transition-all duration-200 min-w-[64px] ${isActive ? 'bg-blue-600/30 text-white shadow-inner' : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'}`}
      onClick={handleClick}
      title={tooltip ?? label}
    >
      <div className={`text-2xl mb-1 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-200`}>
        {icon}
      </div>
      <span className="text-[11px] font-medium leading-tight text-center">{label}</span>
      {isActive && <div className="absolute bottom-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />}
    </button>
  );
}

const DropdownToolBtn = ({
  options,
  activeTool,
  setActiveTool,
  label
}: {
  options: { tool: ToolType; icon: React.ReactNode; tooltip: string }[];
  activeTool: ToolType;
  setActiveTool: (t: ToolType) => void;
  label: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = options.find(o => o.tool === activeTool) || options[0];
  const isActive = options.some(o => o.tool === activeTool);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center min-w-[64px]">
      <div className={`flex bg-transparent rounded-md overflow-hidden border border-transparent transition-all duration-200 ${isActive ? 'bg-blue-600/20 border-blue-500/30' : 'hover:bg-slate-700/50'}`}>
        <button
          className={`flex flex-col items-center p-2 border-r border-slate-700/50 ${activeTool === currentOption.tool ? 'text-blue-400' : 'text-slate-300'}`}
          onClick={() => setActiveTool(currentOption.tool)}
          title={currentOption.tooltip}
        >
          <div className="text-2xl mb-1 transition-transform duration-200 hover:scale-110">{currentOption.icon}</div>
        </button>
        <button
          className={`px-1 transition-colors ${isOpen ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <MdArrowDropDown className={`text-xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <span className="text-[11px] mt-1 text-slate-400 font-medium">{label}</span>

      {isOpen && (
        <div
          className="absolute top-[calc(100%-12px)] left-0 mt-2 bg-slate-800 border-2 border-slate-600 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[99999] p-2 min-w-[420px] animate-in fade-in zoom-in-95 slide-in-from-top-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 mb-2 text-[10px] font-bold text-slate-400 tracking-widest border-b border-slate-700 w-full uppercase">PFEIL-VARIANTEN</div>
          <div className="grid grid-cols-3 gap-2">
            {options.map((opt) => (
              <button
                key={opt.tool}
                className={`flex flex-col items-center justify-center gap-2 p-3 text-[10px] rounded-lg border transition-all duration-200 ${activeTool === opt.tool ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500'}`}
                onClick={() => {
                  setActiveTool(opt.tool);
                  setIsOpen(false);
                }}
              >
                <div className="text-2xl">{opt.icon}</div>
                <div className="font-bold text-center leading-tight">{opt.tooltip.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function RibbonGroup({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="ribbon-group">
      <div className="ribbon-group-buttons">{children}</div>
      <span className="ribbon-group-label">{label}</span>
    </div>
  );
}

interface RibbonProps {
  onOpenFile: () => void;
  activeDocId: string | null;
}

export function Ribbon({ onOpenFile, activeDocId }: RibbonProps) {
  const [activeTab, setActiveTab] = useState<RibbonTab>('Start');

  const {
    setZoom, setRotation, undo, redo, toggleSidebar, toggleAnnotationsVisible,
    openDocuments, activeTool, setActiveTool, activeColor, setActiveColor,
    activeFillColor, setActiveFillColor,
    deleteSelectedAnnotation, deleteAnnotation, addAnnotations, toggleOcrTransparency,
    ocrTransparencyEnabled, setOcrTransparency, calculatorOpen, toggleCalculator,
    distCalculatorOpen, toggleDistCalculator, activeDocumentId,
    magZoom, setMagZoom,
    deletePage, insertPage, movePage, movePageRelative, movePageRange
  } = useAppStore();

  const transparencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const doc = openDocuments.find((d) => d.id === activeDocumentId);

  const adjustZoom = (delta: number) => {
    if (!doc) return;
    setZoom(doc.id, doc.zoom + delta);
  };

  const fitPage = () => {
    if (!doc) return;
    setZoom(doc.id, 1.0);
  };

  const handlePrint = () => {
    if (!doc?.fileUrl) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = doc.fileUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 60000);
      }, 500);
    };
  };

  const handleOCRComplete = (annotations: { text: string; x: number; y: number; width: number; height: number; fontSize?: number }[]) => {
    if (!doc) return;
    console.log('📥 Ribbon: OCR Complete empfangen', annotations.length, 'Annotationen');
    // Füge die OCR-Texte als Annotationen hinzu
    const textAnnotations = annotations.map(ann => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'text' as const,
      page: doc.currentPage,
      color: 'rgba(79, 142, 247, 0.3)',
      opacity: 1,
      createdAt: Date.now(),
      position: { x: ann.x, y: ann.y },
      text: ann.text,
      fontSize: ann.fontSize || 13,
      isOcr: true,
      width: ann.width,
      height: ann.height,
      selected: true // Auto-select so it can be deleted immediately
    }));
    console.log('📤 Ribbon: Sende', textAnnotations.length, 'Annotationen an Store');
    // Verwende die addAnnotations Funktion aus dem Store
    addAnnotations(doc.id, doc.currentPage, textAnnotations);
    console.log('✅ Ribbon: Annotationen gesendet');
  };

  const handleSave = async () => {
    if (doc) {
      await downloadPdfWithAnnotations(doc);
    }
  };

  return (
    <div className="ribbon">
      <div className="ribbon-tabs">
        {RIBBON_TABS.map((tab) => (
          <button
            key={tab}
            className={`ribbon-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ribbon-content">
        {activeTab === 'Start' && (
          <>
            <RibbonGroup label="Datei">
              <ToolBtn icon={<MdFolderOpen />} label="Öffnen" onClick={onOpenFile} tooltip="PDF öffnen (Strg+O)" />
              <ToolBtn icon={<MdSave />} label="Speichern" onClick={handleSave} tooltip="Als PDF speichern" />
              <ToolBtn icon={<MdPrint />} label="Drucken" onClick={handlePrint} tooltip="Drucken (Strg+P)" />
            </RibbonGroup>
            <RibbonGroup label="Bearbeiten">
              <ToolBtn
                icon={<MdUndo />}
                label="Rückgängig"
                onClick={() => doc && undo(doc.id)}
                tooltip="Rückgängig (Strg+Z)"
              />
              <ToolBtn
                icon={<MdRedo />}
                label="Wiederholen"
                onClick={() => doc && redo(doc.id)}
                tooltip="Wiederholen (Strg+Y)"
              />
            </RibbonGroup>
            <RibbonGroup label="Werkzeuge">
              <ToolBtn icon={<MdSelectAll />} label="Auswählen" tool="cursor" tooltip="Auswahlwerkzeug (V)" />
              <ToolBtn icon={<MdPanTool />} label="Hand" tool="hand" tooltip="Hand/Verschieben (H)" />
            </RibbonGroup>
            <RibbonGroup label="Seitenleiste">
              <ToolBtn icon={<MdViewSidebar />} label="Panel" onClick={toggleSidebar} tooltip="Seitenleiste umschalten" />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Ansicht' && (
          <>
            <RibbonGroup label="Zoom">
              <ToolBtn icon={<MdZoomIn />} label="Vergrößern" onClick={() => adjustZoom(0.25)} tooltip="Vergrößern (Strg++)" />
              <ToolBtn icon={<MdZoomOut />} label="Verkleinern" onClick={() => adjustZoom(-0.25)} tooltip="Verkleinern (Strg+-)" />
              <ToolBtn icon={<MdFitScreen />} label="Anpassen" onClick={fitPage} tooltip="An Seite anpassen (Strg+0)" />
            </RibbonGroup>
            <RibbonGroup label="Drehen">
              <ToolBtn
                icon={<MdRotateRight />}
                label="Drehen"
                onClick={() => doc && setRotation(doc.id, (doc.rotation + 90) % 360)}
                tooltip="90° drehen"
              />
            </RibbonGroup>
            <RibbonGroup label="Ansicht">
              <ToolBtn icon={<MdViewSidebar />} label="Miniaturen" onClick={toggleSidebar} tooltip="Miniaturvorschau" />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Bearbeiten' && (
          <>
            <RibbonGroup label="Auswahl">
              <ToolBtn icon={<MdSelectAll />} label="Wählen" tool="cursor" tooltip="Auswählen (V)" />
            </RibbonGroup>
            <RibbonGroup label="Markierung">
              <ToolBtn icon={<MdHighlight />} label="Hervorheben" tool="highlight" tooltip="Text hervorheben" />
              <ToolBtn icon={<MdComment />} label="Notiz" tool="callout" tooltip="Notiz / Sprechblase" />
              <ToolBtn icon={<MdTextFields />} label="Text" tool="text" tooltip="Textfeld einfügen" />
            </RibbonGroup>
            <RibbonGroup label="Ansicht">
              <ToolBtn
                icon={doc?.annotationsVisible ? <MdVisibility /> : <MdVisibilityOff />}
                label="Notizen"
                active={doc?.annotationsVisible}
                onClick={() => doc && toggleAnnotationsVisible(doc.id)}
                tooltip="Notizen ein/ausblenden"
              />
            </RibbonGroup>
            <RibbonGroup label="Aktion">
              <ToolBtn icon={<MdEdit />} label="Bearbeiten" tool="direct-edit" tooltip="Direkt bearbeiten" />
              <ToolBtn
                icon={<MdDelete />}
                label="Löschen"
                tooltip="Ausgewählte Annotation löschen (Entf)"
                onClick={() => doc && deleteSelectedAnnotation(doc.id)}
              />
            </RibbonGroup>
            <RibbonGroup label="OCR">
              {doc && (
                <OCRButton
                  docId={doc.id}
                  currentPage={doc.currentPage}
                  onOCRComplete={handleOCRComplete}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                />
              )}
            </RibbonGroup>
            <RibbonGroup label="OCR">
              <ToolBtn
                icon={<MdOpacity />}
                label="Transparenz"
                active={ocrTransparencyEnabled}
                onClick={() => {
                  if (ocrTransparencyEnabled) {
                    setOcrTransparency(false);
                    if (transparencyTimeoutRef.current) {
                      clearTimeout(transparencyTimeoutRef.current);
                      transparencyTimeoutRef.current = null;
                    }
                  } else {
                    setOcrTransparency(true);
                    // Reset transparency after 5 seconds
                    if (transparencyTimeoutRef.current) clearTimeout(transparencyTimeoutRef.current);
                    transparencyTimeoutRef.current = setTimeout(() => {
                      setOcrTransparency(false);
                      transparencyTimeoutRef.current = null;
                    }, 5000);
                  }
                }}
                tooltip="OCR-Textboxen für 5 Sek. transparent machen"
              />
            </RibbonGroup>
            <RibbonGroup label="Farbe">
              <ColorPicker
                label="Farbe"
                color={activeColor}
                onChange={setActiveColor}
                allowTransparent={false}
              />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Zeichnen' && (
          <>
            <RibbonGroup label="Werkzeuge">
              <DropdownToolBtn
                label="Wählen"
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                options={[
                  { tool: 'cursor', icon: <MdSelectAll />, tooltip: 'Rechteck-Auswahl — Ziehen zum Selektieren' },
                  { tool: 'cursor-lasso', icon: <TbLasso size={22} />, tooltip: 'Lasso-Auswahl — Freihand zum Selektieren' },
                ]}
              />
              <ToolBtn icon={<MdGesture />} label="Freihand" tool="freehand" tooltip="Freihandzeichnen" />
              <ToolBtn icon={<BiEraser size={24} />} label="Löschen" tool="eraser" tooltip="Objekte anklicken zum einzeln Löschen" />
              <ToolBtn icon={<MdFormatColorFill />} label="Füllwerkzeug" tool="fill-tool" tooltip="Flächen füllen" />
            </RibbonGroup>
            <RibbonGroup label="Formen">
              <ToolBtn icon={<MdOutlineSquare />} label="Rechteck" tool="rect-shape" tooltip="Rechteck zeichnen" />
              <ToolBtn icon={<MdOutlineCircle />} label="Kreis" tool="circle-shape" tooltip="Kreis zeichnen" />
              <ToolBtn icon={<MdHorizontalRule />} label="Linie" tool="line-shape" tooltip="Gerade Linie zeichnen" />
              <DropdownToolBtn
                label="Pfeile"
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                options={[
                  { tool: 'arrow-shape', icon: <MdArrowForward />, tooltip: 'Pfeil (Standard)' },
                  { tool: 'double-arrow-shape', icon: <MdSyncAlt />, tooltip: 'Doppelpfeil (Beidseitig)' },
                  { tool: 'arrow-dashed', icon: <MdArrowRightAlt />, tooltip: 'Gepunktet (Dashed)' },
                  { tool: 'arrow-filled', icon: <MdArrowForward className="stroke-2" />, tooltip: 'Blockpfeil (Fett)' },
                  { tool: 'arrow-measurement', icon: <MdStraight />, tooltip: 'Maßpfeil (T-Bar)' },
                  { tool: 'arrow-block', icon: <MdArrowRight className="scale-150" />, tooltip: 'Kontur-Pfeil (Art)' },
                  { tool: 'arrow-curved', icon: <MdShortcut />, tooltip: 'Bogen-Pfeil (Kurve)' },
                  { tool: 'arrow-zigzag', icon: <MdTrendingUp />, tooltip: 'Stufen-Pfeil (Z-Pfeil)' },
                ]}
              />
            </RibbonGroup>
            <RibbonGroup label="Aktionen">
              <ToolBtn
                icon={<MdOutlineCleaningServices />}
                label="Leeren"
                tooltip="Alle Annotationen auf dieser Seite löschen"
                onClick={() => {
                  if (!doc || !confirm("Alle Zeichnungen auf dieser Seite löschen?")) return;
                  const pageAnns = doc.annotations[doc.currentPage] || [];
                  pageAnns.forEach(ann => deleteAnnotation(doc.id, doc.currentPage, ann.id));
                }}
              />
            </RibbonGroup>
            <RibbonGroup label="Farben">
              <div style={{ display: 'flex', gap: 12 }}>
                <ColorPicker
                  label="Umriss"
                  color={activeColor}
                  onChange={setActiveColor}
                  allowTransparent={false}
                />
                <ColorPicker
                  label="Füllen"
                  color={activeFillColor}
                  onChange={setActiveFillColor}
                  allowTransparent={true}
                />
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Messen' && (
          <>
            <RibbonGroup label="Messen">
              <ToolBtn icon={<MdTimeline />} label="Abstand" tool="measure-distance" tooltip="Abstand messen" />
              <ToolBtn icon={<MdOutlineSquare />} label="Fläche" tool="measure-area" tooltip="Fläche messen" />
              <ToolBtn icon={<MdOutlineCircle />} label="Kreis-Fläche" tool="measure-circle" tooltip="Kreisfläche messen (über Diagonale)" />
            </RibbonGroup>
            <RibbonGroup label={
              <span style={{ fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                {doc && doc.scale.unit !== 'px' ? `1px = ${(1 / doc.scale.pixelsPerUnit).toPrecision(3)} ${doc.scale.unit}` : 'MAßSTAB'}
              </span>
            }>
              <ToolBtn icon={<TbRulerMeasure />} label="Kalibrieren" tool="measure-calibrate" tooltip="Maßstab festlegen" />
            </RibbonGroup>
            <RibbonGroup label="Lupe">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 4px' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Lupenfaktor:</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={magZoom}
                  onChange={(e) => setMagZoom(parseInt(e.target.value) || 1)}
                  style={{
                    width: '60px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    padding: '2px 6px',
                    outline: 'none'
                  }}
                />
              </div>
            </RibbonGroup>
            <RibbonGroup label="Auswertung">
              <ToolBtn
                icon={<MdFunctions />}
                label="Flächen"
                active={calculatorOpen}
                onClick={toggleCalculator}
                tooltip="Messergebnisse auswerten (Flächen-Fenster)"
              />
              <ToolBtn
                icon={<MdFunctions />}
                label="Längen"
                active={distCalculatorOpen}
                onClick={toggleDistCalculator}
                tooltip="Messergebnisse auswerten (Längen-Fenster)"
              />
            </RibbonGroup>
            <RibbonGroup label="Aktionen">
              <ToolBtn
                icon={<MdOutlineCleaningServices />}
                label="Leeren"
                tooltip="Alle Annotationen auf dieser Seite löschen"
                onClick={() => {
                  if (!doc || !confirm("Alle Zeichnungen und Messungen auf dieser Seite löschen?")) return;
                  const pageAnns = doc.annotations[doc.currentPage] || [];
                  pageAnns.forEach(ann => deleteAnnotation(doc.id, doc.currentPage, (ann as any).id));
                }}
              />
            </RibbonGroup>
          </>
        )}
        {activeTab === 'Seiten' && (
          <>
            <RibbonGroup label="Seite verwalten">
              <ToolBtn
                icon={<MdDeleteSweep />}
                label="Seite löschen"
                tooltip="Aktuelle Seite aus dem Dokument entfernen"
                onClick={() => {
                  if (!activeDocId || !doc || !confirm(`Seite ${doc.currentPage} wirklich löschen?`)) return;
                  deletePage(activeDocId, doc.currentPage - 1);
                }}
              />
              <ToolBtn
                icon={<MdAddBox />}
                label="Blatt davor"
                tooltip="Leere Seite vor der aktuellen Seite einfügen"
                onClick={() => {
                  if (activeDocId && doc) insertPage(activeDocId, doc.currentPage - 1);
                }}
              />
              <ToolBtn
                icon={<MdAddBox />}
                label="Blatt danach"
                tooltip="Leere Seite nach der aktuellen Seite einfügen"
                onClick={() => {
                  if (activeDocId && doc) insertPage(activeDocId, doc.currentPage);
                }}
              />
            </RibbonGroup>
            <RibbonGroup label="Reihenfolge">
              <ToolBtn
                icon={<MdArrowUpward />}
                label="Nach Oben"
                tooltip="Aktuelle Seite eine Position nach vorne schieben"
                onClick={() => {
                  if (activeDocId && doc) movePageRelative(activeDocId, doc.currentPage - 1, -1);
                }}
              />
              <ToolBtn
                icon={<MdArrowDownward />}
                label="Nach Unten"
                tooltip="Aktuelle Seite eine Position nach hinten schieben"
                onClick={() => {
                  if (activeDocId && doc) movePageRelative(activeDocId, doc.currentPage - 1, 1);
                }}
              />
            </RibbonGroup>
            <RibbonGroup label="Mehrere Seiten">
              <ToolBtn
                icon={<MdDeleteSweep />}
                label="Bereich löschen"
                tooltip="Einen Seitenbereich löschen (z.B. 2-5)"
                onClick={() => {
                  if (!activeDocId || !doc) return;
                  const rangeStr = prompt("Seitenbereich zum Löschen (z.B. 2-5):");
                  if (!rangeStr) return;
                  const parts = rangeStr.split('-');
                  const start = parseInt(parts[0]);
                  const end = parts.length > 1 ? parseInt(parts[1]) : start;
                  if (isNaN(start) || isNaN(end)) return;
                  if (!confirm(`${start} bis ${end} wirklich löschen?`)) return;
                  for (let i = end; i >= start; i--) {
                    deletePage(activeDocId, i - 1);
                  }
                }}
              />
              <ToolBtn
                icon={<MdFormatColorFill />}
                label="Bereich einfügen"
                tooltip="Mehrere leere Seiten einfügen"
                onClick={() => {
                  if (!activeDocId || !doc) return;
                  const countStr = prompt("Wie viele leere Seiten einfügen?", "1");
                  const count = parseInt(countStr || "0");
                  if (count > 0) {
                    for (let i = 0; i < count; i++) {
                      insertPage(activeDocId, doc.currentPage);
                    }
                  }
                }}
              />
              <ToolBtn
                icon={<MdSyncAlt />}
                label="Bereich verschieben"
                tooltip="Seitenbereich an eine andere Stelle verschieben"
                onClick={() => {
                  if (!activeDocId || !doc) return;
                  const rangeStr = prompt("Seitenbereich verschieben (von-bis, z.B. 2-5):");
                  const targetStr = prompt("Verschieben vor Seite (z.B. 10):");
                  if (!rangeStr || !targetStr) return;
                  const parts = rangeStr.split('-');
                  const start = parseInt(parts[0]);
                  const end = parts.length > 1 ? parseInt(parts[1]) : start;
                  const target = parseInt(targetStr);
                  if (isNaN(start) || isNaN(end) || isNaN(target)) return;
                  movePageRange(activeDocId, start - 1, end - 1, target - 1);
                }}
              />
            </RibbonGroup>
          </>
        )}
      </div>
    </div>
  );
}