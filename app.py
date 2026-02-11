import os
import io
import base64
import hashlib
import uuid
from datetime import datetime

from flask import (
    Flask, render_template, request, jsonify,
    send_from_directory, session, redirect, url_for
)
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import qrcode
from PIL import Image

app = Flask(__name__)
app.secret_key = os.urandom(24)

# ---------------------------------------------------------------------------
# Directory for saving generated QR images
# ---------------------------------------------------------------------------
QR_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "generated_qr")
os.makedirs(QR_OUTPUT_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Crypto helpers (same algorithm as original qr_code_generator.py)
# ---------------------------------------------------------------------------
DEFAULT_IV = b"abcabcabcabcabca"  # 16-byte IV


def _derive_key(passphrase: str) -> bytes:
    """Derive a 32-byte AES-256 key from a passphrase via SHA-256."""
    return hashlib.sha256(passphrase.encode()).digest()


def encrypt_aes(message: str, key: bytes, iv: bytes = DEFAULT_IV) -> str:
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ct = cipher.encrypt(pad(message.encode(), AES.block_size))
    return base64.urlsafe_b64encode(ct).decode()


def decrypt_aes(cipher_text_b64: str, key: bytes, iv: bytes = DEFAULT_IV) -> str:
    ct = base64.urlsafe_b64decode(cipher_text_b64)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    pt = unpad(cipher.decrypt(ct), AES.block_size)
    return pt.decode()


# ---------------------------------------------------------------------------
# QR generation helper
# ---------------------------------------------------------------------------
def generate_qr_image(data: str) -> Image.Image:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill="black", back_color="white").convert("RGB")


def image_to_base64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json(force=True)
    passphrase = data.get("key", "")
    prefix = data.get("prefix", "")
    base_url = data.get("base_url", "http://localhost:5000/verify?hash=")
    try:
        start = int(data.get("start", 1))
        end = int(data.get("end", 1))
    except (ValueError, TypeError):
        return jsonify({"error": "Start and end must be integers."}), 400

    if not passphrase or not prefix:
        return jsonify({"error": "Encryption key and prefix are required."}), 400
    if start > end:
        return jsonify({"error": "Start must be ≤ end."}), 400
    if (end - start) > 99:
        return jsonify({"error": "Maximum 100 codes at a time."}), 400

    key = _derive_key(passphrase)
    results = []

    # Ensure session history exists
    if "history" not in session:
        session["history"] = []

    for i in range(start, end + 1):
        code = f"{prefix}{i}"
        encrypted = encrypt_aes(code, key)
        final_url = base_url + encrypted
        img = generate_qr_image(final_url)

        # Save to disk
        filename = f"{code}_{uuid.uuid4().hex[:6]}.png"
        filepath = os.path.join(QR_OUTPUT_DIR, filename)
        img.save(filepath)

        b64 = image_to_base64(img)
        results.append({
            "code": code,
            "encrypted": encrypted,
            "url": final_url,
            "image": b64,
            "filename": filename,
        })

        session["history"] = session.get("history", []) + [{
            "code": code,
            "filename": filename,
            "url": final_url,
            "created": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }]

    session.modified = True
    return jsonify({"results": results})


@app.route("/verify")
def verify_page():
    hash_param = request.args.get("hash", "")
    return render_template("verify.html", hash_param=hash_param)


@app.route("/api/verify", methods=["POST"])
def api_verify():
    data = request.get_json(force=True)
    cipher_text = data.get("hash", "")
    passphrase = data.get("key", "")

    if not cipher_text or not passphrase:
        return jsonify({"error": "Hash and decryption key are required."}), 400

    # Strip base URL if full URL was pasted
    if "hash=" in cipher_text:
        cipher_text = cipher_text.split("hash=")[-1]

    key = _derive_key(passphrase)
    try:
        plaintext = decrypt_aes(cipher_text, key)
    except Exception:
        return jsonify({"error": "Decryption failed. Check the hash and key."}), 400

    return jsonify({"plaintext": plaintext, "status": "verified"})


@app.route("/history")
def history():
    items = session.get("history", [])
    return render_template("history.html", items=items)


@app.route("/download/<filename>")
def download(filename):
    return send_from_directory(QR_OUTPUT_DIR, filename, as_attachment=True)


@app.route("/clear-history", methods=["POST"])
def clear_history():
    session.pop("history", None)
    return redirect(url_for("history"))


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
