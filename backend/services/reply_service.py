import json
import aiohttp
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class ReplyService:
    def __init__(self):
        self.ollama_url = "http://localhost:11434/api/generate"
        self.model = "llama3.2"

    async def _generate_replies(self, message: str, num_replies: int = 3) -> List[str]:
        """Generate contextual replies using Llama 3.2."""
        prompt = (
            "You are chatting with a friend. Generate 3 short, casual responses to their message.\n\n"
            f"Friend: \"{message}\"\n\n"
            "Your responses should be natural and conversational, like how a real friend would reply. "
            "Format as JSON array, example: [\"Hey, that's awesome! 🎉\", \"No way! Tell me more!\", \"So happy for you! 😊\"]\n\n"
            "Only output the JSON array, nothing else. Keep responses short and friendly."
        )

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.ollama_url,
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False
                    }
                ) as response:
                    if response.status != 200:
                        logger.error(f"Ollama API error: {response.status}")
                        return []

                    data = await response.json()
                    response_text = data.get("response", "")
                    logger.info(f"Raw Llama response: {response_text}")
                    
                    # Try to extract JSON array from the response
                    try:
                        # Find the first [ and last ] in the response
                        start = response_text.find("[")
                        end = response_text.rfind("]") + 1
                        if start >= 0 and end > start:
                            json_str = response_text[start:end]
                            replies = json.loads(json_str)
                            if isinstance(replies, list):
                                return replies[:num_replies]
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse Llama response as JSON: {response_text}")
                    
                    return []

        except Exception as e:
            logger.error(f"Error generating replies: {str(e)}")
            return []

    async def analyze_message(self, message: str) -> Dict[str, Any]:
        """Analyze a message and generate contextual information."""
        replies = await self._generate_replies(message)
        logger.info(f"Generated replies: {replies}")
        
        if not replies:
            return {
                "original_message": message,
                "replies": [],
                "contexts": [],
                "adjectives": []
            }

        # Generate context and adjectives for each reply
        contexts_prompt = (
            "Analyze this casual conversation and extract key words and emotions.\n\n"
            f"Message: \"{message}\"\n"
            f"Replies: {json.dumps(replies)}\n\n"
            "Extract 3-4 key words that describe what's being discussed, and 2-3 emotional words that capture the mood.\n"
            "Format as JSON:\n"
            "{\n"
            "  \"contexts\": [\"key\", \"topic\", \"words\"],\n"
            "  \"adjectives\": [\"emotional\", \"mood\", \"words\"]\n"
            "}\n"
            "Only output the JSON object. Be specific to this conversation."
        )

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.ollama_url,
                    json={
                        "model": self.model,
                        "prompt": contexts_prompt,
                        "stream": False
                    }
                ) as response:
                    if response.status != 200:
                        return {
                            "original_message": message,
                            "replies": replies,
                            "contexts": [],
                            "adjectives": []
                        }

                    data = await response.json()
                    response_text = data.get("response", "")
                    logger.info(f"Raw context analysis response: {response_text}")
                    
                    # Try to extract JSON object from the response
                    try:
                        # Find the first { and last } in the response
                        start = response_text.find("{")
                        end = response_text.rfind("}") + 1
                        if start >= 0 and end > start:
                            json_str = response_text[start:end]
                            analysis = json.loads(json_str)
                            return {
                                "original_message": message,
                                "replies": replies,
                                "contexts": analysis.get("contexts", []),
                                "adjectives": analysis.get("adjectives", [])
                            }
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse context analysis: {response_text}")
                    
                    return {
                        "original_message": message,
                        "replies": replies,
                        "contexts": [],
                        "adjectives": []
                    }

        except Exception as e:
            logger.error(f"Error analyzing contexts: {str(e)}")
            return {
                "original_message": message,
                "replies": replies,
                "contexts": [],
                "adjectives": []
            } 