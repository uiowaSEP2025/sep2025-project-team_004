# ruff: noqa
import os
from collections.abc import Sequence
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
PRODUCTION_DOTENVS_DIR = BASE_DIR / ".envs" / ".production"
PRODUCTION_DOTENV_FILES = [
    PRODUCTION_DOTENVS_DIR / ".django",
    PRODUCTION_DOTENVS_DIR / ".postgres",
]
DOTENV_FILE = BASE_DIR / ".env"


def merge(output_file: Path, files_to_merge: Sequence[Path]) -> None:
    merged_content = "\n".join(file.read_text().strip() for file in files_to_merge if file.read_text().strip())
    if merged_content:  
        merged_content += "\n"
    output_file.write_text(merged_content)


if __name__ == "__main__":
    merge(DOTENV_FILE, PRODUCTION_DOTENV_FILES)
