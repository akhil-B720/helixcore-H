from flask import Blueprint, request, jsonify
from backend.services.ai_service import generate_topic_explanation

topic_bp = Blueprint("topic", __name__)

@topic_bp.route("/topic/explain", methods=["GET", "POST"])
def explain_topic():
    data = request.get_json(silent=True) or {}
    topic = data.get("topic") or request.args.get("topic")

    if not topic:
        return jsonify({"ok": False, "error": "Topic required"}), 400

    result = generate_topic_explanation(topic)

    return jsonify({
        "ok": True,
        "concept": result["concept"],
        "explanation": result["explanation"],
        "visualization": result["visualization"],
        "example": result["example"],
        "application": result["application"]
    })