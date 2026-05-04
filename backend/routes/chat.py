from flask import Blueprint, request, jsonify
from backend.services.ai_service import AIService

chat_bp = Blueprint("chat", __name__)
ai = AIService()

@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    topic = (data.get("topic") or "").strip() or None

    if not message:
        return jsonify({"ok": False, "error": "message is required"}), 400

    result = ai.chat(message, topic)
    # Always return a stable JSON shape for the frontend.
    return jsonify({
        "ok": True,
        "data": {
            "concept": result.get("concept", ""),
            "explanation": result.get("explanation", ""),
            "visualization": result.get("visualization", ""),
            "example": result.get("example", ""),
            "application": result.get("application", ""),
        }
    })