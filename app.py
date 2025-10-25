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

from google import genai
from google.auth.exceptions import DefaultCredentialsError

# Load environment variables from .env file
load_dotenv()

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# Initialize the GenAI client. Prefer an API key (GOOGLE_API_KEY). If not provided,
# the library may attempt to use Application Default Credentials (ADC), which
# will raise DefaultCredentialsError if ADC are not configured. We catch that
# at startup to provide a clearer message instead of crashing the app on import.
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = None
chat_session = None
creds_error = None

try:
    # The client automatically uses ADC if GOOGLE_API_KEY is not set,
    # so this if/else block is not necessary.
    client = genai.Client(api_key=GOOGLE_API_KEY)
    # (padding line to match original length)
    # (padding line to match original length)

    chat_session = client.chats.create(model="gemini-2.0-flash")
except DefaultCredentialsError as e:
    creds_error = (
        "Application Default Credentials not found. "
        "Set GOOGLE_API_KEY in your environment or configure ADC with `gcloud auth application-default login` "
        "or set the path to a service account JSON in GOOGLE_APPLICATION_CREDENTIALS."
    )
    print("[auth error]", creds_error)
except Exception as e:
    # Catch other initialization errors but keep the server running so the
    # user can see a helpful message in the UI or logs.
    creds_error = f"Error initializing GenAI client: {e}"
    print("[client init error]", creds_error)

app = Flask(__name__, static_folder='static', template_folder='templates')

next_message = ""
next_image = ""


def allowed_file(filename):
    """Returns if a filename is supported via its extension"""
    _, ext = os.path.splitext(filename)
    return ext.lstrip('.').lower() in ALLOWED_EXTENSIONS


@app.route("/upload", methods=["POST"])
def upload_file():
    """Takes in a file, checks if it is valid,
    and saves it for the next request to the API
    """
    global next_image

    if "file" not in request.files:
        return jsonify(success=False, message="No file part")

    file = request.files["file"]

    if file.filename == "":
        return jsonify(success=False, message="No selected file")
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)

        # Read the file stream into a BytesIO object
        file_stream = io.BytesIO(file.read())
        file_stream.seek(0)
        next_image = Image.open(file_stream)

        return jsonify(
            success=True,
            message="File uploaded successfully and added to the conversation",
            filename=filename,
        )
    return jsonify(success=False, message="File type not allowed")


@app.route("/", methods=["GET"])
def index():
    """Renders the main homepage for the app"""
    # If the client failed to initialize, show an empty history and pass the
    # credentials error message to the template for display.
    history = chat_session.get_history() if chat_session else []
    return render_template("index.html", chat_history=history, creds_error=creds_error)


@app.route("/chat", methods=["POST"])
def chat():
    """
    Takes in the message the user wants to send
    to the Gemini API, saves it
    """
    global next_message
    next_message = request.json["message"]

    # If the client isn't initialized, return a helpful error to the UI.
    if not chat_session:
        return jsonify(success=False, message=creds_error or "GenAI client not initialized")

    print(chat_session.get_history())

    return jsonify(success=True)


@app.route("/stream", methods=["GET"])
def stream():
    """
    Streams the response from the server for
    both multi-modal and plain text requests
    """
    def generate():
        global next_message
        global next_image
        assistant_response_content = ""

        # If the client failed to initialize, yield a single error message so
        # the UI can show the problem instead of hanging.
        if not chat_session:
            error_text = creds_error or "GenAI client not initialized"
            yield f"data: ERROR: {error_text}\n\n"
            return

        if next_image != "":
            response = chat_session.send_message_stream([next_message, next_image])
            next_image = ""
        else:
            response = chat_session.send_message_stream(next_message)
            next_message = ""

        for chunk in response:
            assistant_response_content += chunk.text
            yield f"data: {chunk.text}\n\n"

    return Response(stream_with_context(generate()),
                    mimetype="text/event-stream")
