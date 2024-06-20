import base64
import json
import os
import signal
import sys

from PIL import Image
from io import BytesIO
from flask import Flask, render_template, request
from types import FrameType

from .embedding import get_embedding
from .utils.logging import logger

app = Flask(__name__)

@app.route("/compare", methods = ["POST"])
def compare() -> str:
    assert len(request.files) >= 2
    images = {
      fn: {'im': Image.open(f) }
      for fn, f in request.files.items()
    }
    images['base']['embedding'] = get_embedding(images['base']['im'])
    for fn in images:
        cropped_img_path = f'/tmp/{fn}_cropped.jpg'
        images[fn]['embedding'] = get_embedding(images[fn]['im'], cropped_img_path=cropped_img_path)
        with open(cropped_img_path, 'rb') as f:
            b64_img_data = base64.b64encode(f.read()).decode('utf8')
            images[fn]['crop'] = f'data:image/jpeg;base64,{b64_img_data}'
        os.remove(cropped_img_path)
    res = {
        fn: {
            'dist': images[fn]['embedding'].dist(images['base']['embedding']).item() if fn != 'base' else 0.0,
            'crop': images[fn]['crop'],
        }
        for fn in images.keys()
    }
    res = json.dumps(res)
    return res

# NB: following are routes handled by the react app, so all we need to do is render the template that contains that js

@app.route("/")
def index() -> str:
    return render_template('chrome.html')

@app.route("/about")
def about() -> str:
    return render_template('chrome.html')

def shutdown_handler(signal_int: int, frame: FrameType) -> None:
    logger.info(f"Caught Signal {signal.strsignal(signal_int)}")

    from utils.logging import flush

    flush()

    # Safely exit program
    sys.exit(0)


if __name__ == "__main__":
    # Running application locally, outside of a Google Cloud Environment

    # handles Ctrl-C termination
    signal.signal(signal.SIGINT, shutdown_handler)

    app.run(host="localhost", port=8080, debug=True)
else:
    # handles Cloud Run container termination
    signal.signal(signal.SIGTERM, shutdown_handler)
