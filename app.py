import base64  # Add this line at the beginning of the file

from flask import (
    Flask,
    render_template,
    request,
    Response,
    stream_with_context,
    jsonify,
)
from werkzeug.utils import secure_filename
from PIL import Image
import io
from dotenv import load_dotenv
import os

import google.generativeai as genai
print(f"google-generativeai version: {genai.__version__}")

# Loading environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

# Getting API key from environment variable
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("API key not found. Make sure the .env file exists and contains GOOGLE_API_KEY.")

print(f"API Key: {'*' * len(api_key)}")  # Masking the key for security

# Configuring genai using the key from the environment variable
genai.configure(api_key=api_key)

ALLOWED_EXTENSIONS = {
    "png", "jpg", "jpeg", "gif", "pdf",
    "flv", "mov", "mpeg", "mpg", "mp4", "webm", "wmv", "3gpp",
    "aac", "flac", "mp3", "m4a", "opus", "wav"
}

# WARNING: Do not share code with you API key hard coded in it.
# Get your Gemini API key from: https://aistudio.google.com/app/apikey

try:
    model = genai.GenerativeModel('gemini-1.5-pro-002')
    response = model.generate_content("Hello, world!", stream=False)
    print("API test response:", response.text)
except Exception as e:
    print("Error while testing API:", str(e))

model = genai.GenerativeModel('gemini-1.5-pro-002')

app = Flask(__name__, static_folder='static', template_folder='templates')

chat_history = []
next_message = ""
next_files = []  # Changed from next_image to next_files to support multiple files


def allowed_file(filename):
    """Returns if a filename is supported via its extension"""
    _, ext = os.path.splitext(filename)
    return ext.lstrip('.').lower() in ALLOWED_EXTENSIONS


@app.route("/upload", methods=["POST"])
def upload_file():
    global next_files

    print("File upload request received")
    print("Files in request:", request.files)

    if "file" not in request.files and "files[]" not in request.files:
        print("Neither 'file' nor 'files[]' found in request.files")
        return jsonify(success=False, message="No file part"), 400

    files = request.files.getlist("file") if "file" in request.files else request.files.getlist("files[]")
    
    uploaded_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_data = file.read()
            mime_type = get_mime_type(file_data)
            
            file_content = base64.b64encode(file_data).decode('utf-8')
            
            file_info = {
                "id": len(next_files),
                "name": filename,
                "data": file_content,
                "mime_type": mime_type
            }
            next_files.append(file_info)
            uploaded_files.append({"id": file_info["id"], "name": filename})
            print(f"File {filename} successfully uploaded (MIME: {mime_type}, size: {len(file_data)} bytes)")
        else:
            print(f"Invalid file type: {file.filename}")
            return jsonify(success=False, message=f"File type not allowed: {file.filename}"), 400

    print(f"Successfully uploaded files: {len(uploaded_files)}")
    return jsonify(
        success=True,
        message="Files uploaded successfully and added to the conversation",
        files=uploaded_files,
    )


@app.route("/", methods=["GET"])
def index():
    """Renders the main homepage for the app"""
    return render_template("index.html", chat_history=chat_history)


@app.route("/chat", methods=["POST"])
def chat():
    global next_message, next_files, chat_history
    data = request.json
    next_message = data.get("message", "")
    print(f"Message to send: {next_message}")
    print(f"Attached files: {', '.join([f['name'] for f in next_files])}")
    print(f"Number of attached files: {len(next_files)}")
    return jsonify(success=True)


@app.route("/stream", methods=["GET"])
def stream():
    def generate():
        global next_message, next_files, chat_history
        assistant_response_content = ""

        try:
            print(f"Sending message: {next_message}")
            content = [next_message]
            
            for file in next_files:
                print(f"Processing file: {file['name']} (MIME: {file['mime_type']})")
                if 'data' in file and 'mime_type' in file:
                    content.append({
                        "mime_type": file["mime_type"],
                        "data": file["data"]
                    })
                else:
                    print(f"Error: missing necessary data in file {file.get('name', 'unknown')}")

            print(f"Sending content to Gemini (number of files: {len(next_files)})")
            response = model.generate_content(content, stream=True)

            for chunk in response:
                assistant_response_content += chunk.text
                yield f"data: {chunk.text}\n\n"
            
            chat_history.append({"role": "assistant", "content": assistant_response_content})
        except Exception as e:
            print(f"Error in generate: {str(e)}")
            print(f"Number of files in next_files: {len(next_files)}")
            yield f"data: Error: {str(e)}\n\n"

        next_files = []  # Clearing the list of files after processing

    return Response(stream_with_context(generate()),
                    mimetype="text/event-stream")

def get_mime_type(file_data):
    """Determines the MIME type of a file by its content"""
    if file_data.startswith(b'\x89PNG\r\n\x1a\n'):
        return "image/png"
    elif file_data.startswith(b'\xff\xd8\xff'):
        return "image/jpeg"
    elif file_data.startswith(b'GIF87a') or file_data.startswith(b'GIF89a'):
        return "image/gif"
    elif file_data.startswith(b'%PDF'):
        return "application/pdf"
    elif file_data.startswith(b'\x00\x00\x00 ftyp'):
        return "video/mp4"
    # Add other checks for video and audio formats
    return "application/octet-stream"  # Return a general type if unable to determine

@app.route("/remove_file", methods=["POST"])
def remove_file():
    global next_files
    file_id = request.json.get("file_id")
    if file_id is not None:
        next_files = [f for f in next_files if f["id"] != file_id]
        return jsonify(success=True, message="File removed successfully")
    return jsonify(success=False, message="File ID not provided"), 400