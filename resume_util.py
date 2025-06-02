# File: resume_util.py

import json
import os
import logging
from pathlib import Path

logger = logging.getLogger('resume_util')

def load_resume_file(resume_file_path):
    """Load resume data from a JSON file."""
    if not resume_file_path:
        return {}

    path = Path(resume_file_path)
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_resume_file(resume_file_path, data):
    """Save resume data to a JSON file."""
    if not resume_file_path:
        logger.debug("No resume file path provided, skipping save")
        return

    with open(resume_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.debug(f"Saved resume data to {resume_file_path}")

def delete_resume_file(resume_file_path):
    """Delete the resume file if it exists."""
    if not resume_file_path:
        return

    path = Path(resume_file_path)
    if path.exists():
        path.unlink()
        logger.info(f"Deleted resume file: {resume_file_path}")
