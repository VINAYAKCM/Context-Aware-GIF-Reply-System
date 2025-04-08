import os
from typing import List, Dict, Optional, Any
import requests
from dotenv import load_dotenv
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import numpy as np
import logging
import aiohttp
from .reply_service import ReplyService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class GifService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.giphy_url = "https://api.giphy.com/v1/gifs/search"
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.reply_service = ReplyService()
        self.giphy_api_key = os.getenv('GIPHY_API_KEY')
        if not self.giphy_api_key:
            raise ValueError("GIPHY_API_KEY environment variable is not set")
            
        logger.info("Initializing sentiment analyzer...")
        self.sentiment_analyzer = pipeline("sentiment-analysis")
        logger.info("Initializing sentence transformer...")
        self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("GIF Service initialized successfully")
        
    async def _search_giphy(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search GIPHY API with the given query."""
        try:
            async with aiohttp.ClientSession() as session:
                params = {
                    'api_key': self.api_key,
                    'q': query,
                    'limit': limit,
                    'rating': 'g'
                }
                
                async with session.get(self.giphy_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('data', [])
                    else:
                        logger.error(f"GIPHY API error: {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Error searching GIPHY: {str(e)}")
            return []

    def _rank_gifs_by_relevance(self, text: str, gifs: List[Dict[str, Any]], context_words: List[str], adjectives: List[str]) -> List[Dict[str, Any]]:
        """Rank GIFs by relevance using context words and adjectives."""
        if not gifs:
            return []

        # Combine text with context words and adjectives for better matching
        enhanced_text = f"{text} {' '.join(context_words)} {' '.join(adjectives)}"
        text_embedding = self.model.encode([enhanced_text])[0]
        
        ranked_gifs = []
        for gif in gifs:
            title = gif.get('title', '').lower()
            
            # Calculate base similarity
            title_embedding = self.model.encode([title])[0]
            similarity = np.dot(text_embedding, title_embedding)
            
            # Boost score if title contains context words or adjectives
            context_boost = sum(1 for word in context_words if word.lower() in title) * 0.1
            adjective_boost = sum(1 for adj in adjectives if adj.lower() in title) * 0.15
            
            # Small penalty for ALL CAPS titles (likely promotional)
            caps_penalty = 0.15 if title.isupper() else 0
            
            final_score = similarity + context_boost + adjective_boost - caps_penalty
            
            ranked_gifs.append({
                'id': gif['id'],
                'url': gif['images']['original']['url'],
                'preview': gif['images']['fixed_height']['url'],
                'title': gif['title'],
                'similarity': float(final_score)
            })
        
        return sorted(ranked_gifs, key=lambda x: x['similarity'], reverse=True)

    async def get_gif_suggestions(self, text: str) -> Dict[str, Any]:
        """Get GIF suggestions based on message analysis and generated replies."""
        # Analyze message and generate replies
        analysis = await self.reply_service.analyze_message(text)
        
        # Log the analysis results
        logger.info(f"Message analysis: {analysis}")
        
        if not analysis['replies']:
            logger.warning("No replies generated, falling back to direct search")
            gifs = await self._search_giphy(text)
            ranked_gifs = self._rank_gifs_by_relevance(text, gifs, [], [])
            return {
                'gifs': ranked_gifs[:6],
                'debug_info': {
                    'input_text': text,
                    'replies': [],
                    'search_query': text
                }
            }

        # Use the first generated reply as the search query
        search_query = analysis['replies'][0]
        
        # Search for GIFs using the generated reply
        gifs = await self._search_giphy(search_query)
        
        # Rank GIFs using the reply text
        ranked_gifs = self._rank_gifs_by_relevance(
            search_query,
            gifs,
            [],  # No context words needed
            []   # No adjectives needed
        )

        return {
            'gifs': ranked_gifs[:6],
            'debug_info': {
                'input_text': text,
                'replies': analysis['replies'],
                'search_query': search_query
            }
        }

    async def search_gifs(self, query: str) -> List[Dict[str, Any]]:
        """Direct search with enhanced query generation and sentiment analysis."""
        try:
            # Analyze sentiment
            sentiment_result = self.sentiment_analyzer(query)[0]
            sentiment = sentiment_result['label']
            
            # Generate enhanced search query
            enhanced_query = self._generate_search_query(query, sentiment)
            logger.info(f"Enhanced search query: {enhanced_query}")
            
            # Search with both original and enhanced queries
            original_gifs = await self._search_giphy(query, limit=5)
            enhanced_gifs = await self._search_giphy(enhanced_query, limit=5)
            
            # Combine and deduplicate results
            all_gifs = []
            seen_ids = set()
            
            for gif_list in [original_gifs, enhanced_gifs]:
                for gif in gif_list:
                    if gif['id'] not in seen_ids:
                        all_gifs.append(gif)
                        seen_ids.add(gif['id'])
            
            # Extract key terms for context
            words = query.lower().split()
            common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            context_words = [word for word in words if word not in common_words]
            
            # Get sentiment-based adjectives
            sentiment_adjectives = {
                'POSITIVE': ['happy', 'excited', 'joyful'],
                'NEGATIVE': ['sad', 'upset', 'disappointed'],
                'NEUTRAL': ['calm', 'neutral', 'steady']
            }.get(sentiment, [])
            
            # Rank GIFs with enhanced context
            ranked_gifs = self._rank_gifs_by_relevance(
                query,
                all_gifs,
                context_words=context_words,
                adjectives=sentiment_adjectives
            )
            
            logger.info(f"Found {len(ranked_gifs)} GIFs for query: {query}")
            return ranked_gifs[:6]  # Return top 6 GIFs
            
        except Exception as e:
            logger.error(f"Error in enhanced GIF search: {str(e)}")
            # Fallback to basic search if enhancement fails
            gifs = await self._search_giphy(query)
            return self._rank_gifs_by_relevance(query, gifs, [], [])[:6]

    def _generate_search_query(self, text: str, sentiment: str) -> str:
        """
        Generate a search query based on text and sentiment
        """
        # Map BERT sentiment labels to search terms
        sentiment_mapping = {
            'POSITIVE': ['happy', 'excited', 'joy', 'celebration', 'awesome', 'great', 'love', 'yes'],
            'NEGATIVE': ['sad', 'upset', 'disappointed', 'sorry', 'no', 'worried', 'angry'],
            'NEUTRAL': ['okay', 'hmm', 'interesting', 'thinking', 'maybe']
        }
        
        # Get sentiment keywords
        sentiment_keywords = sentiment_mapping.get(sentiment, ['neutral'])
        
        # Extract key terms from text (simple word-based approach)
        words = text.lower().split()
        # Filter out common words and focus on meaningful words
        common_words = {'this', 'is', 'that', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'am', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had'}
        key_terms = [word for word in words if len(word) > 2 and word not in common_words][:3]  # Take up to 3 significant words
        
        # If we have meaningful words from the text, prioritize them
        if key_terms:
            search_terms = key_terms + [sentiment_keywords[0]]
        else:
            # If no meaningful words, use sentiment-based search
            search_terms = [sentiment_keywords[0], sentiment_keywords[1] if len(sentiment_keywords) > 1 else '']
        
        search_query = " ".join(filter(None, search_terms))
        logger.info(f"Generated search query: {search_query}")
        return search_query
    
    async def search_gifs_manual(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Manual GIF search functionality
        """
        try:
            logger.info(f"Performing manual GIF search with query: {query}")
            gifs = await self._search_giphy(query, limit)
            results = [{
                'id': gif.get('id'),
                'url': gif.get('url'),
                'preview': gif.get('preview'),
                'title': gif.get('title', '')
            } for gif in gifs]
            logger.info(f"Found {len(results)} GIFs in manual search")
            return results
            
        except Exception as e:
            logger.error(f"Error in manual GIF search: {str(e)}")
            return [] 