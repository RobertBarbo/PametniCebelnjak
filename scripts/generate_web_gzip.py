"""Pred izdelavo LittleFS pripravi stisnjene različice statičnih spletnih datotek."""

from gzip import compress
from pathlib import Path

Import("env")


web_directory = Path(env.subst("$PROJECT_DIR")) / "web"

for source_path in web_directory.rglob("*"):
    if not source_path.is_file() or source_path.suffix not in {".html", ".css", ".js"}:
        continue

    compressed_path = source_path.with_name(f"{source_path.name}.gz")
    compressed_content = compress(source_path.read_bytes(), compresslevel=9, mtime=0)
    if not compressed_path.exists() or compressed_path.read_bytes() != compressed_content:
        compressed_path.write_bytes(compressed_content)
