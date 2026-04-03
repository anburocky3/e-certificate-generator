from __future__ import annotations

import re
from pathlib import Path

from PIL import ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent


def sanitize_filename(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    return cleaned.strip("._-") or "student"


def normalize_name(value: str) -> str:
    value = re.sub(r"\s+", " ", value.strip())
    if not value:
        return value

    def capitalize_chunk(chunk: str) -> str:
        if not chunk:
            return chunk
        return chunk[0].upper() + chunk[1:].lower()

    def normalize_token(token: str) -> str:
        trailing_dot = token.endswith(".")
        core = token[:-1] if trailing_dot else token

        if "." in core:
            parts = [p for p in core.split(".") if p]
            if parts and all(len(p) == 1 and p.isalpha() for p in parts):
                result = ".".join(p.upper() for p in parts)
                if trailing_dot:
                    result += "."
                return result

        if len(core) == 1 and core.isalpha():
            result = core.upper()
            if trailing_dot:
                result += "."
            return result

        pieces = re.split(r"([-'])", core)
        normalized_pieces = [capitalize_chunk(piece) if piece not in {"-", "'"} else piece for piece in pieces]
        result = "".join(normalized_pieces)
        if trailing_dot:
            result += "."
        return result

    return " ".join(normalize_token(token) for token in value.split(" "))


def normalize_key(value: str | None) -> str:
    return re.sub(r"\s+", "", str(value or "")).strip().lower()


def normalize_lookup_value(value: str | None) -> str:
    return str(value or "").strip().lower()


def parse_color(value: str) -> tuple[int, int, int]:
    value = value.strip().lstrip("#")
    if len(value) != 6:
        raise ValueError("Color must be a 6-digit hex value, e.g. 1A1A1A")
    red = int(value[0:2], 16)
    green = int(value[2:4], 16)
    blue = int(value[4:6], 16)
    return red, green, blue


def resolve_font(font_path: Path | None, font_size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if font_path:
        return ImageFont.truetype(str(font_path), font_size)

    pacifico_candidates = [
        PROJECT_ROOT / "assets" / "fonts" / "Pacifico-Regular.ttf",
        PROJECT_ROOT / "Pacifico-Regular.ttf",
        Path("C:/Windows/Fonts/Pacifico.ttf"),
        Path("C:/Windows/Fonts/Pacifico-Regular.ttf"),
    ]
    for candidate in pacifico_candidates:
        if candidate.exists():
            try:
                return ImageFont.truetype(str(candidate), font_size)
            except OSError:
                pass

    try:
        return ImageFont.truetype("arial.ttf", font_size)
    except OSError:
        return ImageFont.load_default()

