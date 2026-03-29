'use client';
import { MdClose, MdAdd, MdPictureAsPdf } from 'react-icons/md';
import { useAppStore } from '@/store/useAppStore';

interface DocTabBarProps {
  onOpenFile: () => void;
}

export function DocTabBar({ onOpenFile }: DocTabBarProps) {
  const { openDocuments, activeDocumentId, setActiveDocument, closeDocument } = useAppStore();

  return (
    <div className="doc-tabbar">
      {openDocuments.map((doc) => (
        <div
          key={doc.id}
          className={`doc-tab ${doc.id === activeDocumentId ? 'active' : ''}`}
          onClick={() => setActiveDocument(doc.id)}
        >
          <MdPictureAsPdf style={{ fontSize: 14, flexShrink: 0, color: '#e53935' }} />
          <span className="doc-tab-name" title={doc.fileName}>
            {doc.fileName}
          </span>
          <span
            className="doc-tab-close"
            onClick={(e) => {
              e.stopPropagation();
              closeDocument(doc.id);
            }}
          >
            <MdClose style={{ fontSize: 12 }} />
          </span>
        </div>
      ))}
      <div className="doc-tab-add" onClick={onOpenFile} title="PDF öffnen">
        <MdAdd />
      </div>
    </div>
  );
}
