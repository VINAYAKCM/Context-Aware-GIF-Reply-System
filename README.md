# Context-Aware GIF Reply System

An enhanced messaging application that automatically suggests GIFs based on the emotional context of conversations.

## Features

- **Automatic GIF Suggestions**: System analyzes message context and suggests relevant GIFs
- **Real-time Analysis**: Dynamic GIF suggestions as you type
- **Manual GIF Search**: Option to manually search for GIFs
- **Modern UI**: Clean and intuitive chat interface

## Project Structure

```
.
├── frontend/           # React frontend application
├── backend/           # FastAPI backend server
└── README.md
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory with your GIPHY API key:
```
GIPHY_API_KEY=your_api_key_here
```

4. Start the backend server:
```bash
uvicorn main:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:
- `GIPHY_API_KEY`: Your GIPHY API key

## API Documentation

The backend API documentation will be available at `http://localhost:8000/docs` when the server is running.

## License

MIT 