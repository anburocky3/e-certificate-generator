from __future__ import annotations

import json
import secrets
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

from .excel import StudentRecord
from .utils import sanitize_filename


@dataclass(slots=True)
class ManifestRecord:
    certificate_id: str
    name: str
    row: int
    file_name: str
    roll_no: str | None = None
    email: str | None = None


def build_manifest_records(students: list[StudentRecord], prefix: str) -> list[ManifestRecord]:
    _ = prefix  # Kept for CLI compatibility; ID format is fixed as <name>_certificate_<id>.
    used_ids: set[str] = set()
    records: list[ManifestRecord] = []
    for student in students:
        safe_name = sanitize_filename(student.name)
        for _ in range(10_000):
            random_digits = secrets.randbelow(9000) + 1000  # 1000-9999
            candidate_id = f"{safe_name}_certificate_{random_digits}"
            if candidate_id not in used_ids:
                certificate_id = candidate_id
                used_ids.add(certificate_id)
                break
        else:
            raise ValueError("Unable to generate a unique certificate_id.")

        file_name = f"{certificate_id}.png".lower()
        records.append(
            ManifestRecord(
                certificate_id=certificate_id,
                name=student.name,
                row=student.row,
                file_name=file_name,
                roll_no=student.roll_no,
                email=student.email,
            )
        )
    return records


def write_manifest(output_dir: Path, records: list[ManifestRecord]) -> Path:
    manifest_path = output_dir / "index.json"
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "certificateCount": len(records),
        "records": [asdict(record) for record in records],
    }
    manifest_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest_path

