# File: resume_util.py

import json
import os
import logging

logger = logging.getLogger('resume_util')

def load_resume_file(resume_file_path):
    if os.path.exists(resume_file_path):
        with open(resume_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if 'groups' not in data:
                data['groups'] = {}
            return data
    else:
        return {'groups': {}}

def save_resume_file(resume_file_path, resume_data):
    with open(resume_file_path, 'w', encoding='utf-8') as f:
        json.dump(resume_data, f)
    logger.info(f"Saved resume data to {resume_file_path}")

def delete_resume_file(resume_file_path):
    if os.path.exists(resume_file_path):
        os.remove(resume_file_path)
        logger.info(f"Deleted resume file {resume_file_path}")
