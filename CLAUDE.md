# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Install dependencies:**
```bash
pip install poetry
poetry install
```

**Run the main application:**
```bash
poetry run summarize_signal_group --help
poetry run summarize_signal_group --list-groups
poetry run summarize_signal_group --group GROUP_ID
```

**Configuration:**
- Copy `config.json.sample` to `config.json` and adjust settings before first use
- Configuration is managed via JSON and supports multiple LLM providers (Ollama, OpenAI, Venice)

## Architecture Overview

This is a Signal group conversation summarizer that processes messages from SQLite databases using large language models. The system is designed to handle multi-step AI processing with resume capabilities.

**Core Components:**

- `summarize_signal_group.py`: Main CLI entry point with argument parsing
- `group_summarizer.py`: Core summarization orchestration and processing logic
- `llm_util.py`: LLM abstraction layer with structured output parsing using Pydantic models
- `resume_util.py`: Handles saving/loading processing state to resume interrupted operations
- `vision_util.py`: Image description using multimodal models via Ollama
- `cluster.py`: Embedding-based theme clustering using DBSCAN and Ollama embeddings

**Processing Pipeline:**

1. **Theme Extraction**: Extract main conversation themes using LLM
2. **Optional Clustering**: Group similar themes using embeddings + DBSCAN clustering
3. **Theme Recombination**: Merge similar themes based on similarity thresholds
4. **Link Processing**: Summarize shared links including YouTube videos  
5. **Attachment Processing**: Handle images (vision model) and audio (whisper transcription)
6. **Translation**: Optional final translation to target language

**LLM Provider Architecture:**
- Supports multiple providers: Ollama (local), OpenAI API, Venice API
- Model configuration in JSON allows easy switching between models for different tasks
- Uses structured output with Pydantic models for reliable parsing

**Resume System:**
- Saves progress after each major step to handle interruptions
- Group-specific progress tracking for batch processing
- Configurable via CLI args or config file

**Key Features:**
- Fully local operation possible (Ollama + whisper)
- Embedding-based clustering to reduce LLM calls
- Configurable similarity thresholds for theme merging
- Multi-language support with translation capabilities