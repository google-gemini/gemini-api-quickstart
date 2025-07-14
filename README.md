# Gemini API Quickstart - Python

This repository contains a simple Python Flask App running with the Google AI Gemini API, designed to get you started building with Gemini's multi-modal capabilities. The app comes with a basic UI and a Flask backend.

<img width="1271" alt="Screenshot 2024-05-07 at 7 42 28 AM" src="https://github.com/logankilpatrick/gemini-api-quickstart/assets/35577566/156ae3e0-cffa-47a3-8a71-1bded78c4632">

## Basic request

To send your first API request with the [Google Gen AI SDK](https://ai.google.dev/gemini-api/docs/libraries#python), make sure you have the right dependencies installed (see installation steps below) and then run the following code:

```python
from google import genai

client = genai.Client(api_key="GEMINI_API_KEY")
chat = client.chats.create(model="gemini-2.0-flash")

response = chat.send_message("Hello world!")
print(response.text)

response = chat.send_message("Explain to me how AI works")
print(response.text)

for message in chat.get_history():
    print(f'role - {message.role}',end=": ")
    print(message.parts[0].text)
```

## Setup

1. If you don’t have Python installed, install it [from Python.org](https://www.python.org/downloads/).

2. [Clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) this repository.

3. Create a new virtual environment:

   - macOS:
     ```bash
     $ python -m venv venv
     $ . venv/bin/activate
     ```

   - Windows:
     ```cmd
     > python -m venv venv
     > .\venv\Scripts\activate
     ```

   - Linux:
      ```bash
      $ python -m venv venv
      $ source venv/bin/activate
      ```

4. Install the requirements:

   ```bash
   $ pip install -r requirements.txt
   ```

5. Make a copy of the example environment variables file:

   ```bash
   $ cp .env.example .env
   ```

6. Add your [API key](https://ai.google.dev/gemini-api/docs/api-key) to the newly created `.env` file or as an environment variable.

7. Run the app:

```bash
$ flask run --port=8000
```

You should now be able to access the app from your browser at the following URL: [http://localhost:8000](http://localhost:8000)!
