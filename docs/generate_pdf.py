"""
Genera INFORME-MAESTRO-LABORATORIOS.pdf en el escritorio del usuario.
Usa reportlab para layout profesional a partir del markdown.
"""

import os
import re
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
MD_FILE     = SCRIPT_DIR / "INFORME-MAESTRO-LABORATORIOS.md"
def _get_desktop() -> Path:
    import ctypes
    try:
        buf = ctypes.create_unicode_buffer(32768)
        ctypes.windll.shell32.SHGetFolderPathW(0, 0x0000, 0, 0, buf)  # CSIDL_DESKTOP
        p = Path(buf.value)
        if p.exists():
            return p
    except Exception:
        pass
    return Path(os.path.expanduser("~")) / "Desktop"

DESKTOP     = _get_desktop()
OUTPUT_PDF  = DESKTOP / "INFORME-MAESTRO-LABORATORIOS.pdf"

# ── Colores CEN Labs ───────────────────────────────────────────────────────────
NAVY        = colors.HexColor("#023047")
CERULEAN    = colors.HexColor("#219EBC")
ORANGE      = colors.HexColor("#FB8500")
LIGHT_BG    = colors.HexColor("#EFF9FF")
DARK_TEXT   = colors.HexColor("#1a1a2e")
MUTED       = colors.HexColor("#64748b")
CODE_BG     = colors.HexColor("#f1f5f9")
CODE_TEXT   = colors.HexColor("#0f172a")
WARNING_BG  = colors.HexColor("#fff7ed")
WARNING_BDR = colors.HexColor("#fb923c")
WHITE       = colors.white

# ── Estilos ────────────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle("cover_title",
            fontSize=28, fontName="Helvetica-Bold",
            textColor=WHITE, alignment=TA_CENTER,
            spaceAfter=8, leading=34),
        "cover_sub": ParagraphStyle("cover_sub",
            fontSize=13, fontName="Helvetica",
            textColor=colors.HexColor("#b0d4e8"), alignment=TA_CENTER,
            spaceAfter=6, leading=18),
        "cover_meta": ParagraphStyle("cover_meta",
            fontSize=9, fontName="Helvetica",
            textColor=colors.HexColor("#7fb8d0"), alignment=TA_CENTER,
            spaceAfter=4),
        "h1": ParagraphStyle("h1",
            fontSize=18, fontName="Helvetica-Bold",
            textColor=NAVY, spaceBefore=18, spaceAfter=8,
            borderPad=4, leading=22),
        "h2": ParagraphStyle("h2",
            fontSize=13, fontName="Helvetica-Bold",
            textColor=CERULEAN, spaceBefore=14, spaceAfter=6, leading=17),
        "h3": ParagraphStyle("h3",
            fontSize=11, fontName="Helvetica-Bold",
            textColor=NAVY, spaceBefore=10, spaceAfter=4, leading=14),
        "h4": ParagraphStyle("h4",
            fontSize=10, fontName="Helvetica-BoldOblique",
            textColor=MUTED, spaceBefore=8, spaceAfter=3, leading=13),
        "body": ParagraphStyle("body",
            fontSize=9.5, fontName="Helvetica",
            textColor=DARK_TEXT, spaceAfter=5, leading=14,
            alignment=TA_JUSTIFY),
        "bullet": ParagraphStyle("bullet",
            fontSize=9.5, fontName="Helvetica",
            textColor=DARK_TEXT, spaceAfter=3, leading=13,
            leftIndent=14, firstLineIndent=0),
        "code": ParagraphStyle("code",
            fontSize=8, fontName="Courier",
            textColor=CODE_TEXT, spaceAfter=2, leading=11,
            leftIndent=6),
        "blockquote": ParagraphStyle("blockquote",
            fontSize=9, fontName="Helvetica-Oblique",
            textColor=MUTED, spaceAfter=4, leading=13,
            leftIndent=16, borderPad=4),
        "warning": ParagraphStyle("warning",
            fontSize=9, fontName="Helvetica",
            textColor=colors.HexColor("#7c2d12"), spaceAfter=4, leading=13,
            leftIndent=10),
        "footer": ParagraphStyle("footer",
            fontSize=7.5, fontName="Helvetica",
            textColor=MUTED, alignment=TA_CENTER),
    }

# ── Header / Footer ────────────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Header line
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 1.2*cm, w, 1.2*cm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.drawString(1.5*cm, h - 0.75*cm, "CEN LABS — INFORME MAESTRO TÉCNICO")
    canvas.setFont("Helvetica", 7.5)
    canvas.drawRightString(w - 1.5*cm, h - 0.75*cm, f"Página {doc.page}")
    # Footer line
    canvas.setFillColor(CERULEAN)
    canvas.rect(0, 0, w, 0.7*cm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(w/2, 0.22*cm, "Documento confidencial — generado 2026-05-10 | commit 49d0892")
    canvas.restoreState()

# ── Portada ────────────────────────────────────────────────────────────────────
def build_cover(styles):
    w, h = A4
    elems = []
    # Fondo navy (simulado con tabla de ancho completo)
    cover_data = [[""]]
    cover_table = Table(cover_data, colWidths=[w - 3*cm], rowHeights=[10*cm])
    cover_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), NAVY),
        ("ROUNDEDCORNERS", [12]),
    ]))

    elems.append(Spacer(1, 2.5*cm))
    elems.append(Paragraph("CEN LABS", styles["cover_title"]))
    elems.append(Paragraph("INFORME MAESTRO TÉCNICO", ParagraphStyle("ct2",
        fontSize=16, fontName="Helvetica",
        textColor=colors.HexColor("#b0d4e8"), alignment=TA_CENTER,
        spaceAfter=20)))
    elems.append(Paragraph("Plataforma de Laboratorios Virtuales de Ciencias", styles["cover_sub"]))
    elems.append(Spacer(1, 1*cm))
    elems.append(HRFlowable(width="60%", thickness=1, color=CERULEAN, hAlign="CENTER"))
    elems.append(Spacer(1, 1*cm))
    for line in [
        "Versión auditada: Diamond State v5.2",
        "Commit: 4439c92 → 49d0892",
        "Fecha: 2026-05-10",
        "Generado por: Claude Sonnet 4.6 (Anthropic)",
    ]:
        elems.append(Paragraph(line, styles["cover_meta"]))
    elems.append(Spacer(1, 2*cm))
    elems.append(HRFlowable(width="80%", thickness=0.5, color=CERULEAN, hAlign="CENTER"))
    elems.append(Spacer(1, 0.6*cm))
    elems.append(Paragraph(
        "Documento técnico para uso con abogados, desarrolladores, inversores y asistentes IA.",
        ParagraphStyle("ds", fontSize=8.5, fontName="Helvetica-Oblique",
            textColor=MUTED, alignment=TA_CENTER)
    ))
    elems.append(PageBreak())
    return elems

# ── Parser de Markdown ─────────────────────────────────────────────────────────
def parse_markdown(md_text, styles):
    elems = []
    lines = md_text.split("\n")
    i = 0
    in_table = False
    table_rows = []
    in_code = False
    code_lines = []
    skip_toc = False

    def flush_table():
        nonlocal table_rows
        if not table_rows:
            return []
        result = []
        col_count = max(len(r) for r in table_rows)
        col_w = (A4[0] - 3.6*cm) / max(col_count, 1)
        col_widths = [col_w] * col_count

        formatted = []
        for ridx, row in enumerate(table_rows):
            frow = []
            for cell in row:
                style = ParagraphStyle("tc",
                    fontSize=7.8,
                    fontName="Helvetica-Bold" if ridx == 0 else "Helvetica",
                    textColor=WHITE if ridx == 0 else DARK_TEXT,
                    leading=10)
                frow.append(Paragraph(cell.strip(), style))
            # pad
            while len(frow) < col_count:
                frow.append(Paragraph("", ParagraphStyle("e", fontSize=7.8)))
            formatted.append(frow)

        t = Table(formatted, colWidths=col_widths, repeatRows=1)
        ts = [
            ("BACKGROUND",   (0,0), (-1,0),  NAVY),
            ("BACKGROUND",   (0,1), (-1,-1), LIGHT_BG),
            ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_BG]),
            ("GRID",         (0,0), (-1,-1), 0.4, colors.HexColor("#cbd5e1")),
            ("TOPPADDING",   (0,0), (-1,-1), 4),
            ("BOTTOMPADDING",(0,0), (-1,-1), 4),
            ("LEFTPADDING",  (0,0), (-1,-1), 6),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
            ("VALIGN",       (0,0), (-1,-1), "TOP"),
        ]
        t.setStyle(TableStyle(ts))
        result.append(t)
        result.append(Spacer(1, 0.3*cm))
        table_rows = []
        return result

    while i < len(lines):
        line = lines[i]

        # Skip YAML frontmatter / index
        if line.startswith("## ÍNDICE"):
            skip_toc = True
        if skip_toc:
            if line.startswith("## ") and "ÍNDICE" not in line:
                skip_toc = False
            else:
                i += 1
                continue

        # Code blocks
        if line.startswith("```"):
            if not in_code:
                in_code = True
                code_lines = []
            else:
                in_code = False
                if code_lines:
                    elems.extend(flush_table())
                    # Code block with light background
                    code_text = "\n".join(code_lines)
                    safe = code_text.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                    for cl in safe.split("\n"):
                        if cl.strip():
                            elems.append(Paragraph(cl, styles["code"]))
                        else:
                            elems.append(Spacer(1, 3))
                    elems.append(Spacer(1, 0.2*cm))
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        # Tables
        if "|" in line and line.strip().startswith("|"):
            elems.extend([]) # flush before table start
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            # Skip separator rows
            if all(re.match(r'^[-:]+$', c) for c in cells if c):
                i += 1
                continue
            table_rows.append(cells)
            i += 1
            continue
        else:
            if table_rows:
                elems.extend(flush_table())

        # Blank lines
        if not line.strip():
            elems.append(Spacer(1, 0.2*cm))
            i += 1
            continue

        # Headings
        if line.startswith("# ") and not line.startswith("## "):
            elems.append(Spacer(1, 0.3*cm))
            text = line[2:].strip()
            elems.append(HRFlowable(width="100%", thickness=2, color=NAVY))
            elems.append(Spacer(1, 0.15*cm))
            elems.append(Paragraph(text, styles["h1"]))
            elems.append(HRFlowable(width="100%", thickness=0.5, color=CERULEAN))
            elems.append(Spacer(1, 0.2*cm))
            i += 1
            continue

        if line.startswith("## "):
            text = line[3:].strip()
            elems.append(Paragraph(text, styles["h2"]))
            i += 1
            continue

        if line.startswith("### "):
            text = line[4:].strip()
            elems.append(Paragraph(text, styles["h3"]))
            i += 1
            continue

        if line.startswith("#### "):
            text = line[5:].strip()
            elems.append(Paragraph(text, styles["h4"]))
            i += 1
            continue

        # Horizontal rule
        if line.strip() in ("---", "***", "___"):
            elems.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0")))
            elems.append(Spacer(1, 0.2*cm))
            i += 1
            continue

        # Blockquote
        if line.startswith("> "):
            text = format_inline(line[2:].strip())
            elems.append(Paragraph(f"<i>{text}</i>", styles["blockquote"]))
            i += 1
            continue

        # Warning (⚠️ lines)
        if line.strip().startswith("⚠️") or "⚠️" in line[:5]:
            text = format_inline(line.strip())
            elems.append(Paragraph(f"⚠ {text}", styles["warning"]))
            i += 1
            continue

        # Bullets
        if re.match(r'^(\s*[-*+]|\s*\d+\.) ', line):
            indent = len(line) - len(line.lstrip())
            text = re.sub(r'^(\s*[-*+]|\s*\d+\.) ', '', line)
            text = format_inline(text)
            bullet_style = ParagraphStyle("b2",
                parent=styles["bullet"],
                leftIndent=14 + indent * 4,
                bulletIndent=4 + indent * 4)
            elems.append(Paragraph(f"• {text}", bullet_style))
            i += 1
            continue

        # Normal paragraph
        text = format_inline(line.strip())
        if text:
            elems.append(Paragraph(text, styles["body"]))
        i += 1

    elems.extend(flush_table())
    return elems


def format_inline(text):
    """Convert inline markdown to ReportLab XML."""
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Italic
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    # Inline code
    text = re.sub(r'`([^`]+)`', r'<font name="Courier" size="8" color="#0f172a">\1</font>', text)
    # Links — keep only the label
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    # Remove remaining markdown symbols
    text = text.replace("~~", "").replace("__", "")
    # Escape ampersands not already escaped
    text = re.sub(r'&(?!amp;|lt;|gt;|#)', '&amp;', text)
    # Escape lone < and >
    text = re.sub(r'<(?![/a-zA-Z])', '&lt;', text)
    return text


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    styles = build_styles()
    md_text = MD_FILE.read_text(encoding="utf-8")

    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        topMargin=1.8*cm,
        bottomMargin=1.5*cm,
        leftMargin=1.8*cm,
        rightMargin=1.8*cm,
        title="CEN Labs — Informe Maestro Técnico",
        author="Claude Sonnet 4.6 / Anthropic",
        subject="Plataforma de Laboratorios Virtuales de Ciencias",
    )

    story = []
    story += build_cover(styles)
    story += parse_markdown(md_text, styles)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF generado: {OUTPUT_PDF}")
    print(f"Tamano: {OUTPUT_PDF.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
