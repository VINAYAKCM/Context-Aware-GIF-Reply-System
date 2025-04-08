import json
import aiohttp
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful chat assistant that generates natural, conversational replies.
Generate 3 different casual, friendly responses that a person might say in a chat conversation.
Your responses should be brief and natural, like how friends text each other.

When responding to requests or questions:
1. Include a clear agreement/okay ("Sure!", "Of course!", "Will do!") or disagreement/no ("Sorry can't", "Not possible", "Maybe later")
2. Then optionally add a follow-up question or comment
3. Keep the tone casual and friendly

Examples for agreement:
- "Sure thing! When do you need it?"
- "Of course I can! Where is it?"
- "Will do! Is it urgent?"

Examples for disagreement:
- "Sorry, can't right now. Maybe later?"
- "Not today, I'm busy"
- "That won't work for me"

Keep responses short, natural and conversational.
The replies you generate are used for searching gifs, so remember, the replies need to be short.
"""

class ReplyService:
    def __init__(self):
        self.ollama_url = "http://localhost:11434/api/generate"
        self.model = "llama3.2"

    async def _generate_replies(self, message: str, num_replies: int = 3) -> List[str]:
        """Generate contextual replies using Llama 3.2."""
        prompt = (
            SYSTEM_PROMPT + "\n\n"
            f"Friend: \"{message}\"\n\n"
            "Your responses should be casual and conversational, like how a real person would reply. "
            "For invitations or suggestions, always start with a clear yes/no or show enthusiasm first.\n\n"
            "Format as JSON array. Example: [\"Yes, absolutely! What time?\", \"That sounds fun! Where at?\", \"Yeah I'm down! Should we grab food first?\"]\n\n"
            "Only output the JSON array, nothing else."
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
            "You are helping understand if responses indicate agreement or disagreement.\n\n"
            f"Message: \"{message}\"\n"
            f"Replies: {json.dumps(replies)}\n\n"
            "Extract the context (agreement/disagreement) and emotional tone. Format as JSON:\n"
            "{\n"
            "  \"contexts\": [\"agreement\" or \"disagreement\"],\n"
            "  \"adjectives\": [\"emotional tone words\"]\n"
            "}\n"
            "Example for 'Can you help me move?': \n"
            "{\n"
            "  \"contexts\": [\"agreement\"],\n"
            "  \"adjectives\": [\"helpful\", \"willing\"]\n"
            "}\n"
            "Example for 'I can't make it today': \n"
            "{\n"
            "  \"contexts\": [\"disagreement\"],\n"
            "  \"adjectives\": [\"regretful\", \"apologetic\"]\n"
            "}\n\n"
            "Only output the JSON object for the current message."
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