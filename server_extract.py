from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Optional extractors
try:
    import fitz  # PyMuPDF
    HAVE_FITZ = True
except Exception:
    HAVE_FITZ = False

try:
    import pdfplumber
    HAVE_PDFPLUMBER = True
except Exception:
    HAVE_PDFPLUMBER = False


def extract_with_pymupdf(data: bytes):
    pages = []
    doc = fitz.open(stream=data, filetype="pdf")
    for i in range(doc.page_count):
        page = doc[i]
        # Use 'text' for reliably linearized text; 'blocks' for layout can be used if needed
        text = page.get_text("text") or ""
        pages.append({"page": i + 1, "text": text})
    return pages


def extract_with_pdfplumber(data: bytes):
    pages = []
    with pdfplumber.open(BytesIO(data)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            pages.append({"page": i, "text": text})
    return pages


@app.route('/extract/pdf', methods=['POST'])
def extract_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "no file"}), 400
    f = request.files['file']
    data = f.read()

    # Prefer PyMuPDF for performance and decoding, fall back to pdfplumber
    if HAVE_FITZ:
        try:
            pages = extract_with_pymupdf(data)
            return jsonify({"pages": pages})
        except Exception as e:
            # Fall through to pdfplumber
            pass
    if HAVE_PDFPLUMBER:
        try:
            pages = extract_with_pdfplumber(data)
            return jsonify({"pages": pages})
        except Exception:
            pass

    return jsonify({"error": "no extractor available"}), 501


if __name__ == '__main__':
    # Usage: pip install flask flask-cors pymupdf pdfplumber
    # python3 server_extract.py
    # Then POST to http://localhost:5000/extract/pdf with form field 'file'
    app.run(host='127.0.0.1', port=5000, debug=False)
