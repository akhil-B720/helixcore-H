from flask import Blueprint, request, jsonify
from backend.services.ai_service import AIService

chat_bp = Blueprint("chat", __name__)
ai = AIService()

@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    result = ai.chat(data.get("message"), data.get("topic"))
    return jsonify(result)