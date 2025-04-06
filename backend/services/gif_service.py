import os
from typing import List, Dict, Optional
import requests
from dotenv import load_dotenv
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import numpy as np
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class GIFService:
    def __init__(self):
        self.giphy_api_key = os.getenv('GIPHY_API_KEY')
        if not self.giphy_api_key:
            raise ValueError("GIPHY_API_KEY environment variable is not set")
            
        logger.info("Initializing sentiment analyzer...")
        self.sentiment_analyzer = pipeline("sentiment-analysis")
        logger.info("Initializing sentence transformer...")
        self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("GIF Service initialized successfully")
        
    async def get_gif_suggestions(self, text: str, limit: int = 5) -> List[Dict]:
        """
        Get GIF suggestions based on text analysis
        """
        try:
            logger.info(f"Analyzing sentiment for text: {text}")
            # Analyze sentiment
            sentiment_result = self.sentiment_analyzer(text)[0]
            sentiment = sentiment_result['label']
            logger.info(f"Detected sentiment: {sentiment}")
            
            # Generate search query based on sentiment and text
            search_query = self._generate_search_query(text, sentiment)
            logger.info(f"Generated search query: {search_query}")
            
            # Search GIPHY API
            gifs = await self._search_giphy(search_query, limit)
            logger.info(f"Found {len(gifs)} GIFs from GIPHY")
            
            # Rank GIFs by relevance
            ranked_gifs = self._rank_gifs_by_relevance(gifs, text)
            logger.info(f"Ranked {len(ranked_gifs)} GIFs by relevance")
            
            return ranked_gifs
            
        except Exception as e:
            logger.error(f"Error getting GIF suggestions: {str(e)}")
            return []
    
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
    
    async def _search_giphy(self, query: str, limit: int) -> List[Dict]:
        """
        Search GIPHY API for GIFs
        """
        try:
            url = "https://api.giphy.com/v1/gifs/search"
            params = {
                'api_key': self.giphy_api_key,
                'q': query,
                'limit': limit,
                'rating': 'g',
                'lang': 'en'
            }
            
            logger.info(f"Sending request to GIPHY API with query: {query}")
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"GIPHY API response status: {response.status_code}")
            
            # Process and format GIF data
            gifs = []
            for gif in data.get('data', []):
                images = gif.get('images', {})
                # Use downsized_large for better quality while maintaining reasonable size
                gif_data = {
                    'id': gif.get('id'),
                    'url': (
                        images.get('downsized_large', {}).get('url') or  # Primary choice
                        images.get('downsized_medium', {}).get('url') or  # Fallback 1
                        images.get('downsized', {}).get('url') or  # Fallback 2
                        images.get('original', {}).get('url')  # Final fallback
                    ),
                    'title': gif.get('title', ''),
                    'preview': (
                        images.get('fixed_width_still', {}).get('url') or  # Primary choice for preview
                        images.get('fixed_height_still', {}).get('url')  # Fallback
                    )
                }
                if gif_data['url']:  # Only add if URL exists
                    gifs.append(gif_data)
            
            logger.info(f"Processed {len(gifs)} GIFs from GIPHY response")
            return gifs
            
        except Exception as e:
            logger.error(f"Error searching GIPHY: {str(e)}")
            if hasattr(e, 'response'):
                logger.error(f"GIPHY API response: {e.response.text}")
            return []
    
    def _rank_gifs_by_relevance(self, gifs: List[Dict], text: str) -> List[Dict]:
        """
        Rank GIFs by relevance to the input text using sentence embeddings
        """
        if not gifs:
            return []
            
        try:
            # Get text embedding
            text_embedding = self.sentence_transformer.encode(text)
            
            # Calculate similarity scores
            ranked_gifs = []
            for gif in gifs:
                gif_title = gif.get('title', '')
                
                # Less aggressive text penalty
                title_words = gif_title.lower().split()
                text_penalty = sum(1 for word in title_words if word.isupper()) / max(len(title_words), 1)
                
                gif_embedding = self.sentence_transformer.encode(gif_title)
                similarity = float(np.dot(text_embedding, gif_embedding) / 
                                (np.linalg.norm(text_embedding) * np.linalg.norm(gif_embedding)))
                
                # Adjust score with a gentler penalty
                adjusted_score = similarity * (1 - text_penalty * 0.15)  # Reduced penalty factor
                
                ranked_gifs.append({
                    'id': gif.get('id'),
                    'url': gif.get('url'),
                    'preview': gif.get('preview'),
                    'title': gif_title,
                    'similarity_score': adjusted_score
                })
            
            # Sort by adjusted similarity score
            ranked_gifs.sort(key=lambda x: x['similarity_score'], reverse=True)
            logger.info(f"Ranked {len(ranked_gifs)} GIFs, top score: {ranked_gifs[0]['similarity_score'] if ranked_gifs else 'N/A'}")
            return ranked_gifs
            
        except Exception as e:
            logger.error(f"Error ranking GIFs: {str(e)}")
            return gifs  # Return unranked GIFs if ranking fails
    
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