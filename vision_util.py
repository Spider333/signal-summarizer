# File: vision_util.py

import logging
import time
from pathlib import Path
from ollama_client import OllamaClient


class VisionUtil:
    def __init__(self, model_name: str, base_url: str):
        self.ollama_client = OllamaClient(model=model_name, url=base_url)
        self.logger = logging.getLogger('vision_util')

    def describe_image(self, image_path: str, prompt: str) -> str:
        """
        Describe an image using the Ollama API with retry logic.

        Args:
            image_path (str): The file path to the image.
            prompt (str): The prompt to guide the description.

        Returns:
            str: The description of the image or a default message if failed.
        """
        retries = 3
        delays = [2, 4, 8]  # Delays in seconds for each retry

        for attempt in range(1, retries + 1):
            try:
                self.logger.debug(
                    f"Attempt {attempt}: Describing image at path '{image_path}' with prompt:\n{prompt}"
                )
                response = self.ollama_client.generate_with_image(
                    prompt=prompt, image_path=image_path
                )
                description = response.strip()
                self.logger.debug(f"Received image description:\n{description}")
                return description

            except Exception as e:
                self.logger.error(
                    f"Ollama API request failed on attempt {attempt} for image '{image_path}': {e}"
                )
                if attempt < retries:
                    delay = delays[attempt - 1]
                    self.logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    self.logger.error(
                        f"All {retries} attempts failed for image '{image_path}'. Skipping this image."
                    )
                    # Return a default description or handle as needed
                    return "Description unavailable due to an error."
