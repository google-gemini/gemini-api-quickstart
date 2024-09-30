# Gemini API Quickstart - Python

This repository contains a simple Flask application in Python that works with the Google AI Gemini API. It is designed to help you get started with Gemini's multimodal capabilities. The application includes a basic user interface and a Flask backend.

<img width="1271" alt="Screenshot 2024-05-07 at 7 42 28 AM" src="https://github.com/logankilpatrick/gemini-api-quickstart/assets/35577566/156ae3e0-cffa-47a3-8a71-1bded78c4632">

## Key Features

The application supports the following key capabilities:

1. File Upload: Users can upload various file types, including images, PDFs, videos, and audio.
2. Chat with AI: Interact with the Gemini model through a text interface.
3. Multimodal Input: Ability to send both text and files in a single request.
4. Streaming Output: AI responses are displayed in real-time.

## Setup and Running

1. Install Python from [Python.org](https://www.python.org/downloads/).

2. Clone this repository.

3. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # For Unix
   # or
   .\venv\Scripts\activate  # For Windows
   ```

4. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

6. Add your [Gemini API key](https://ai.google.dev/gemini-api/docs/api-key) to the `.env` file.

7. Run the application:

   ```bash
   flask run
   ```

You can now open the application in your browser at [http://localhost:5000](http://localhost:5000).

## Using the API

To send a request to the Gemini API using the [Python SDK](https://github.com/google-gemini/generative-ai-python), use the following code:
