from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import socketio
from dotenv import load_dotenv
import os
from typing import List, Dict
import json
from services.gif_service import GifService
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Context-Aware GIF Reply System")

# Configure CORS with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Socket.IO with CORS settings
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["*"],
    ping_timeout=60,
    ping_interval=25
)
socket_app = socketio.ASGIApp(sio, app)

# Initialize GIF service
gif_service = GifService(api_key=os.getenv('GIPHY_API_KEY'))

# Store active users and their connections
active_users: Dict[str, str] = {}

class TextRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "Context-Aware GIF Reply System API"}

@app.post("/api/gif-suggestions")
async def get_gif_suggestions(request: TextRequest):
    """Get GIF suggestions based on text analysis and generated replies."""
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    result = await gif_service.get_gif_suggestions(request.text)
    return result

@app.post("/api/search-gifs")
async def search_gifs(request: TextRequest):
    """Direct GIF search without reply generation."""
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    gifs = await gif_service.search_gifs(request.text)
    return gifs[:6]  # Limit to 6 GIFs for consistency

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    # Remove user from active users if they disconnect
    for username, user_sid in list(active_users.items()):
        if user_sid == sid:
            del active_users[username]

@sio.event
async def join(sid, data):
    username = data.get('username')
    if username:
        active_users[username] = sid
        await sio.emit('user_joined', {'username': username}, skip_sid=sid)

@sio.event
async def message(sid, data):
    # Broadcast message to all users
    await sio.emit('new_message', data)

@sio.event
async def typing(sid, data):
    # Notify other users that someone is typing
    await sio.emit('user_typing', data, skip_sid=sid)

# Mount the Socket.IO app at the root path
app.mount("/", socket_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 