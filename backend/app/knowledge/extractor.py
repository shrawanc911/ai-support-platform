from pathlib import Path

from docx import Document
from pypdf import PdfReader
import re


SUPPORTED_EXTENSIONS = {
    ".txt",
    ".md",
    ".markdown",
    ".pdf",
    ".docx",
}


def extract_text(
    file_path: str,
    file_type: str,
) -> str:

    extension = Path(file_path).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {extension}"
        )

    if extension in {".txt", ".md", ".markdown"}:
        return Path(file_path).read_text(
            encoding="utf-8"
        )

    if extension == ".pdf":
        return extract_pdf(file_path)

    if extension == ".docx":
        return extract_docx(file_path)

    raise ValueError(
        f"Unsupported file type: {file_type}"
    )


def extract_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)

    pages: list[str] = []

    for page in reader.pages:
        text = page.extract_text()

        if text:
            pages.append(text)

    return "\n\n".join(pages)


def extract_docx(file_path: str) -> str:
    document = Document(file_path)

    paragraphs: list[str] = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            paragraphs.append(text)

    return "\n\n".join(paragraphs)

def clean_text(text: str) -> str:
    text = text.replace("\x00", "")

    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()