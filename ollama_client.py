# File: ollama_client.py

import logging
import ollama
from pathlib import Path


class OllamaClient:
    def __init__(self, model, url='http://localhost:11434'):
        self.model = model
        self.client = ollama.Client(host=url)
        self.logger = logging.getLogger('ollama_client')

    def generate(self, prompt):
        try:
            self.logger.debug(f"Sending prompt to Ollama LLM:\n{prompt}")
            response = self.client.generate(model=self.model, prompt=prompt)
            self.logger.debug(f"Received response from Ollama LLM:\n{response['response']}")
            return response['response']
        except Exception as e:
            self.logger.error(f"Ollama API request failed: {e}")
            raise Exception(f"Ollama API request failed: {str(e)}")

    def generate_with_image(self, prompt, image_path):
        try:
            self.logger.debug(f"Sending prompt with image to Ollama LLM:\nPrompt:\n{prompt}\nImage Path: {image_path}")
            response = self.client.generate(model=self.model, prompt=prompt, images=[Path(image_path)])
            self.logger.debug(f"Received response from Ollama LLM:\n{response['response']}")
            return response['response']
        except Exception as e:
            self.logger.error(f"Ollama API request failed: {e}")
            raise Exception(f"Ollama API request failed: {str(e)}")
