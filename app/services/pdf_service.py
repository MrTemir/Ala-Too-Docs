from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


def _font_path() -> Path:
    bundled = Path(__file__).resolve().parents[1] / "pdf_engine" / "fonts" / "DejaVuSans.ttf"
    if bundled.exists():
        return bundled
    windows_arial = Path(r"C:\Windows\Fonts\arial.ttf")
    if windows_arial.exists():
        return windows_arial
    raise FileNotFoundError("Cyrillic font not found")


def generate_document_pdf(title: str, text: str, output_path: str) -> None:
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    font_file = _font_path()
    pdfmetrics.registerFont(TTFont("DocFont", str(font_file)))

    pdf = canvas.Canvas(str(output_file), pagesize=A4)
    width, height = A4
    left = 56
    right = width - 56
    y = height - 64

    pdf.setFont("DocFont", 11)
    pdf.drawCentredString(width / 2, y, "Международный университет Ала-Тоо")
    y -= 18
    pdf.setFont("DocFont", 9)
    pdf.drawCentredString(width / 2, y, "Официальная рассылка")
    y -= 16
    pdf.line(left, y, right, y)
    y -= 36

    pdf.setFont("DocFont", 16)
    for line in _wrap(title, 42):
        pdf.drawCentredString(width / 2, y, line)
        y -= 22
    y -= 16

    pdf.setFont("DocFont", 12)
    for paragraph in text.splitlines() or [""]:
        for line in _wrap(paragraph, 78) or [""]:
            if y < 90:
                pdf.showPage()
                pdf.setFont("DocFont", 12)
                y = height - 64
            pdf.drawString(left, y, line)
            y -= 18
        y -= 8

    y -= 24
    pdf.drawString(left, y, "Подпись: ______________________________")
    y -= 28
    pdf.drawString(left, y, "Дата: ______________________________")
    pdf.save()


def _wrap(value: str, limit: int) -> list[str]:
    words = value.split()
    if not words:
        return []
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if len(candidate) <= limit:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines
