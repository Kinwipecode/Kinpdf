import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import type { OpenDocument } from '@/types';

// Helper: Hex to PDFColor (0-1)
function hexToColor(hex: string) {
    if (!hex) return rgb(0, 0, 0);
    const clean = hex.replace('#', '');
    const r = (parseInt(clean.substring(0, 2), 16) || 0) / 255;
    const g = (parseInt(clean.substring(2, 4), 16) || 0) / 255;
    const b = (parseInt(clean.substring(4, 6), 16) || 0) / 255;
    return rgb(r, g, b);
}

// Global: Download PDF
export async function downloadPdfWithAnnotations(doc: OpenDocument) {
    let srcDoc: PDFDocument | null = null;
    if (doc.fileType === 'pdf') {
        const existingPdfBytes = await fetch(doc.fileUrl).then(res => res.arrayBuffer());
        srcDoc = await PDFDocument.load(existingPdfBytes);
    }

    const outDoc = await PDFDocument.create();
    const font = await outDoc.embedFont(StandardFonts.Helvetica);

    for (const physicalPage of doc.pageOrder) {
        let page: PDFPage;
        let height: number;
        let width: number;

        if (typeof physicalPage === 'number' && srcDoc) {
            const [copiedPage] = await outDoc.copyPages(srcDoc, [physicalPage - 1]);
            page = outDoc.addPage(copiedPage);
            ({ width, height } = page.getSize());
        } else {
            // Blank page or image base
            width = 595.28;
            height = 841.89;
            page = outDoc.addPage([width, height]);

            // If image doc and logic page 1, embed image
            if (doc.fileType === 'image' && physicalPage === 1) {
                const imgBytes = await fetch(doc.fileUrl).then(r => r.arrayBuffer());
                let embeddedImg;
                // Try to detect png by URL
                if (doc.fileUrl.toLowerCase().includes('.png') || doc.fileName.toLowerCase().endsWith('.png')) {
                    embeddedImg = await outDoc.embedPng(imgBytes);
                } else {
                    embeddedImg = await outDoc.embedJpg(imgBytes);
                }

                const dims = embeddedImg.scaleToFit(width - 40, height - 40);
                page.drawImage(embeddedImg, {
                    x: 20, y: height - dims.height - 20,
                    width: dims.width, height: dims.height
                });
            }
        }

        // Get annotations for this physical page
        const pageNum = typeof physicalPage === 'number' ? physicalPage : -1;
        const annotations = doc.annotations[pageNum] || [];

        for (const ann of annotations) {
            const color = hexToColor(ann.color);
            const strokeWidth = ann.strokeWidth || 2;
            const opacity = ann.opacity || 1;

            switch (ann.type) {
                case 'highlight':
                    page.drawRectangle({
                        x: ann.rect.x,
                        y: height - ann.rect.y - ann.rect.height,
                        width: ann.rect.width,
                        height: ann.rect.height,
                        color: color,
                        opacity: 0.3 * opacity,
                    });
                    break;

                case 'freehand':
                    if (ann.points.length < 2) break;
                    for (let i = 0; i < ann.points.length - 1; i++) {
                        const p1 = ann.points[i];
                        const p2 = ann.points[i + 1];
                        page.drawLine({
                            start: { x: p1.x, y: height - p1.y },
                            end: { x: p2.x, y: height - p2.y },
                            color, thickness: strokeWidth, opacity,
                        });
                    }
                    break;

                case 'rect-shape':
                    page.drawRectangle({
                        x: Math.min(ann.start.x, ann.end.x),
                        y: height - Math.max(ann.start.y, ann.end.y),
                        width: Math.abs(ann.end.x - ann.start.x),
                        height: Math.abs(ann.end.y - ann.start.y),
                        borderColor: color,
                        borderWidth: strokeWidth,
                        color: ann.fillColor ? hexToColor(ann.fillColor) : undefined,
                        opacity,
                    });
                    break;

                case 'circle-shape':
                    const radiusX = Math.abs(ann.end.x - ann.start.x) / 2;
                    const radiusY = Math.abs(ann.end.y - ann.start.y) / 2;
                    // Use any to avoid lint for xRadius/yRadius which exists in runtime but might be missing in some type defs
                    (page as any).drawEllipse({
                        x: (ann.start.x + ann.end.x) / 2,
                        y: height - (ann.start.y + ann.end.y) / 2,
                        xRadius: radiusX,
                        yRadius: radiusY,
                        borderColor: color,
                        borderWidth: strokeWidth,
                        color: ann.fillColor ? hexToColor(ann.fillColor) : undefined,
                        opacity,
                    });
                    break;

                case 'line-shape':
                case 'arrow-dashed':
                    page.drawLine({
                        start: { x: ann.start.x, y: height - ann.start.y },
                        end: { x: ann.end.x, y: height - ann.end.y },
                        color, thickness: strokeWidth, opacity,
                        dashArray: ann.type === 'arrow-dashed' ? [5, 5] : undefined,
                    });
                    break;

                case 'arrow-shape':
                case 'arrow-filled':
                case 'arrow-measurement':
                    page.drawLine({
                        start: { x: ann.start.x, y: height - ann.start.y },
                        end: { x: ann.end.x, y: height - ann.end.y },
                        color, thickness: strokeWidth * 1.5, opacity,
                    });
                    // Simple Tip
                    page.drawCircle({
                        x: ann.end.x, y: height - ann.end.y,
                        size: strokeWidth * 3, color, opacity,
                    });
                    break;

                case 'text':
                case 'callout':
                    const text = (ann as any).text || '';
                    if (!text) break;
                    const tx = (ann as any).position?.x ?? (ann as any).rect?.x ?? 0;
                    const ty = (ann as any).position?.y ?? (ann as any).rect?.y ?? 0;
                    const fSize = (ann as any).fontSize || 12;

                    page.drawText(text, {
                        x: tx,
                        y: height - ty - fSize,
                        size: fSize,
                        font,
                        color,
                        opacity,
                    });
                    break;

                case 'measure-distance':
                case 'measure-area':
                    if (ann.points && ann.points.length >= 2) {
                        for (let i = 0; i < ann.points.length - 1; i++) {
                            const p1 = ann.points[i];
                            const p2 = ann.points[i + 1];
                            page.drawLine({
                                start: { x: p1.x, y: height - p1.y },
                                end: { x: p2.x, y: height - p2.y },
                                color, thickness: strokeWidth, opacity,
                            });
                        }
                        const pStart = ann.points[0];
                        page.drawText(`${ann.displayValue} ${ann.unit}`, {
                            x: pStart.x + 5,
                            y: height - pStart.y - 12,
                            size: 10, font, color,
                        });
                    }
                    break;
            }
        }
    }

    const pdfBytes = await outDoc.save();
    // Casting to any to avoid BlobPart compatibility issues in some strict TS environments
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `exported_${doc.fileName.replace('.pdf', '')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
}
