from __future__ import annotations

import argparse
import os
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

from .excel import load_students
from .manifest import build_manifest_records, write_manifest
from .render import draw_centered_name
from .utils import parse_color, resolve_font


RESET = "\x1b[0m"
BOLD = "\x1b[1m"
CYAN = "\x1b[36m"
GREEN = "\x1b[32m"
RED = "\x1b[31m"
ORANGE = "\x1b[38;5;214m"


def _supports_color() -> bool:
    if os.getenv("NO_COLOR"):
        return False
    return sys.stdout.isatty()


def _colorize(text: str, color: str) -> str:
    if not _supports_color():
        return text
    return f"{color}{text}{RESET}"


def _print_table(rows: list[tuple[str, str, str | None]]) -> None:
    key_width = max(len(key) for key, _, _ in rows)
    value_width = max(len(value) for _, value, _ in rows)
    border = f"+-{'-' * key_width}-+-{'-' * value_width}-+"
    print(border)
    for key, value, color in rows:
        padded_value = value.ljust(value_width)
        display_value = _colorize(padded_value, color) if color else padded_value
        print(f"| {key.ljust(key_width)} | {display_value} |")
    print(border)


def _print_reason_block(title: str, reason_counts: Counter[str]) -> None:
    if not reason_counts:
        return

    title_color = ORANGE if "Skipped" in title else RED if "Failed" in title else CYAN
    print(f"\n{_colorize(title, title_color)}:")
    for reason, count in reason_counts.items():
        count_color = ORANGE if "Skipped" in title else RED if "Failed" in title else None
        count_text = _colorize(str(count), count_color) if count_color else str(count)
        print(f"  - {reason}: {count_text}")


def generate_certificates(args: argparse.Namespace) -> None:
    excel_path = Path(args.excel).expanduser().resolve()
    template_path = Path(args.template).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    font_path = Path(args.font).expanduser().resolve() if args.font else None

    if not excel_path.exists():
        raise FileNotFoundError(f"Excel file not found: {excel_path}")
    if not template_path.exists():
        raise FileNotFoundError(f"Template image not found: {template_path}")
    if font_path and not font_path.exists():
        raise FileNotFoundError(f"Font file not found: {font_path}")
    if not 0 <= args.name_zone_top <= 1 or not 0 <= args.name_zone_bottom <= 1:
        raise ValueError("--name-zone-top and --name-zone-bottom must be between 0 and 1.")
    if args.name_zone_top >= args.name_zone_bottom:
        raise ValueError("--name-zone-top must be less than --name-zone-bottom.")
    if args.name_zone_padding < 0:
        raise ValueError("--name-zone-padding must be non-negative.")

    color = parse_color(args.color)
    students = load_students(
        excel_path,
        args.sheet,
        args.name_column,
        args.roll_column,
        args.email_column,
        args.start_row,
        args.end_row,
    )
    if args.limit:
        students = students[: args.limit]

    if not students:
        print("No students found in the Excel file.")
        return

    output_dir.mkdir(parents=True, exist_ok=True)
    font = resolve_font(font_path, args.font_size)
    manifest_records = build_manifest_records(students, args.prefix)

    generated = 0
    skipped = 0
    failed = 0
    skipped_reasons: Counter[str] = Counter()
    failed_reasons: Counter[str] = Counter()
    failure_details: list[str] = []
    finalized_manifest_records = []

    for student, manifest_record in zip(students, manifest_records, strict=True):
        output_file = output_dir / manifest_record.file_name

        if output_file.exists() and not args.overwrite:
            skipped += 1
            skipped_reasons["Output file already exists (--overwrite not set)"] += 1
            finalized_manifest_records.append(manifest_record)
            continue

        if args.dry_run:
            print(f"[DRY RUN] {student.name} -> {output_file.name}")
            generated += 1
            continue

        try:
            with Image.open(template_path).convert("RGB") as image:
                draw_centered_name(
                    image,
                    student.name,
                    font,
                    color,
                    args.name_x,
                    args.name_y,
                    args.name_zone_top,
                    args.name_zone_bottom,
                    args.name_zone_padding,
                )
                image.save(output_file, format="PNG")

            generated += 1
            finalized_manifest_records.append(manifest_record)
        except Exception as exc:  # Keep the batch running and report per-record failures.
            failed += 1
            reason = f"{type(exc).__name__}: {exc}"
            failed_reasons[reason] += 1
            failure_details.append(f"row {student.row} ({student.name}): {reason}")

    if not args.dry_run:
        write_manifest(output_dir, finalized_manifest_records)

    range_start = args.start_row if args.start_row is not None else 2
    range_end = args.end_row if args.end_row is not None else "last"
    print(f"\n{_colorize('Certificate generation overview', BOLD + CYAN)}")
    _print_table(
        [
            ("Generated", str(generated), GREEN),
            ("Skipped", str(skipped), ORANGE),
            ("Failed", str(failed), RED),
            ("Total rows read", str(len(students)), None),
            ("Excel rows processed", f"{range_start} to {range_end}", None),
        ]
    )

    _print_reason_block("Skipped reasons", skipped_reasons)
    _print_reason_block("Failed reasons", failed_reasons)

    if failure_details:
        print(f"\n{_colorize('Failed entries', RED)}:")
        for detail in failure_details[:20]:
            print(f"  - {detail}")
        if len(failure_details) > 20:
            print(f"  - ... and {len(failure_details) - 20} more")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate e-certificates from Excel data.")
    parser.add_argument("--excel", default="input/data.xlsx", help="Path to Excel file (.xlsx).")
    parser.add_argument("--template", default="input/template.png", help="Path to certificate template image.")
    parser.add_argument("--output-dir", default="output", help="Directory for generated certificates.")
    parser.add_argument("--sheet", default=None, help="Optional sheet name. Defaults to active sheet.")
    parser.add_argument("--name-column", default="Name", help="Column header containing student names.")
    parser.add_argument(
        "--roll-column",
        default=None,
        help="Optional column header containing roll numbers. Defaults to common aliases when omitted.",
    )
    parser.add_argument(
        "--email-column",
        default=None,
        help="Optional column header containing email addresses. Defaults to common aliases when omitted.",
    )
    parser.add_argument(
        "--start-row",
        type=int,
        default=None,
        help="First Excel row to process (inclusive, row 1 is header).",
    )
    parser.add_argument("--end-row", type=int, default=None, help="Last Excel row to process (inclusive).")
    parser.add_argument("--font", default=None, help="Optional .ttf/.otf font file path.")
    parser.add_argument("--font-size", type=int, default=200, help="Font size for the student name.")
    parser.add_argument("--name-x", type=int, default=None, help="Fixed X position. Default is centered.")
    parser.add_argument(
        "--name-y",
        type=int,
        default=None,
        help="Fixed Y position. Overrides zone placement when set.",
    )
    parser.add_argument(
        "--name-zone-top",
        type=float,
        default=0.40,
        help="Top of vertical placement zone as image-height ratio (default: 0.44).",
    )
    parser.add_argument(
        "--name-zone-bottom",
        type=float,
        default=0.58,
        help="Bottom of vertical placement zone as image-height ratio (default: 0.58).",
    )
    parser.add_argument(
        "--name-zone-padding",
        type=int,
        default=20,
        help="Extra inner padding in pixels for the vertical placement zone.",
    )
    parser.add_argument("--color", default="FFFFFF", help="Name text color as hex, e.g. FFFFFF.")
    parser.add_argument("--prefix", default="certificate", help="Output file prefix.")
    parser.add_argument("--limit", type=int, default=None, help="Optional row limit for quick testing.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing output files.")
    parser.add_argument("--dry-run", action="store_true", help="Preview file names without writing images.")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    generate_certificates(args)

