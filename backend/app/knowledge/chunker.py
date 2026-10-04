import re


DEFAULT_CHUNK_SIZE = 700
DEFAULT_CHUNK_OVERLAP = 120


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

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


def split_paragraphs(text: str) -> list[str]:
    return [
        paragraph.strip()
        for paragraph in re.split(
            r"\n\s*\n",
            text,
        )
        if paragraph.strip()
    ]


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[str]:

    text = normalize_text(text)

    if not text:
        return []

    paragraphs = split_paragraphs(text)

    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:

        if len(paragraph) > chunk_size:
            if current:
                chunks.append(current.strip())
                current = ""

            chunks.extend(
                split_large_text(
                    paragraph,
                    chunk_size,
                    overlap,
                )
            )

            continue

        candidate = (
            f"{current}\n\n{paragraph}"
            if current
            else paragraph
        )

        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current:
                chunks.append(current.strip())

            current = paragraph

    if current:
        chunks.append(current.strip())

    return chunks


def split_large_text(
    text: str,
    chunk_size: int,
    overlap: int,
) -> list[str]:

    chunks: list[str] = []

    start = 0

    while start < len(text):

        end = min(
            start + chunk_size,
            len(text),
        )

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(
            end - overlap,
            start + 1,
        )

    return chunks