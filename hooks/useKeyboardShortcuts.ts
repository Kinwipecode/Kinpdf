'use client';
import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useKeyboardShortcuts(activeDocId: string | null) {
  const { setActiveTool, undo, redo, setZoom, openDocuments, deleteSelectedAnnotation } = useAppStore();
  const activeDoc = openDocuments.find((d) => d.id === activeDocId);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (e.key === 'Escape') {
        setActiveTool('cursor');
        window.dispatchEvent(new CustomEvent('abort-annotation'));
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const isModifier = e.ctrlKey || e.metaKey || e.altKey;
        const tag = (e.target as HTMLElement).tagName.toLowerCase();
        const isFocused = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement).isContentEditable;

        // If focused on text, only delete object if modifier is held.
        // If NOT focused on text, always delete object.
        if (!isFocused || isModifier) {
          if (activeDocId) {
            e.preventDefault(); // Stop text deletion if we're deleting the whole box
            deleteSelectedAnnotation(activeDocId);
          }
          return;
        }
      }

      // Ctrl combos
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) { if (activeDocId) redo(activeDocId); }
            else { if (activeDocId) undo(activeDocId); }
            break;
          case 'y':
            e.preventDefault();
            if (activeDocId) redo(activeDocId);
            break;
          case '=':
          case '+':
            e.preventDefault();
            if (activeDocId && activeDoc) setZoom(activeDocId, activeDoc.zoom + 0.15);
            break;
          case '-':
            e.preventDefault();
            if (activeDocId && activeDoc) setZoom(activeDocId, activeDoc.zoom - 0.15);
            break;
          case '0':
            e.preventDefault();
            if (activeDocId) setZoom(activeDocId, 1.0);
            break;
        }
      }
    },
    [activeDocId, activeDoc, setActiveTool, undo, redo, setZoom]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
