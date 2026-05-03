from __future__ import annotations

import json

from flask import Blueprint, jsonify, request

from backend.services.ai_service import chat_with_ai, generate_topic_explanation
from backend.services.molecule_service import analyze_molecule
from backend.services.quiz_service import get_quiz_question

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.post("/analyze")
def analyze():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    smiles = payload.get("smiles")
    try:
        result = analyze_molecule(name=name, smiles=smiles)
        return jsonify({"ok": True, "data": result.to_dict()})
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Analysis failed: {exc}"}), 500


@api_bp.post("/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    user_message = payload.get("message", "").strip()
    topic_context = payload.get("topic", "").strip() or None
    if not user_message:
        return jsonify({"ok": False, "error": "message is required"}), 400
    try:
        response = chat_with_ai(user_message, topic_context)
        if response.get("provider") == "openai":
            response["response"] = json.loads(response["raw_json"])
        return jsonify({"ok": True, "data": response["response"], "provider": response["provider"]})
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Chat failed: {exc}"}), 500


@api_bp.post("/topic/explain")
def topic_explain():
    payload = request.get_json(silent=True) or {}
    topic = payload.get("topic", "").strip()
    if not topic:
        return jsonify({"ok": False, "error": "topic is required"}), 400
    try:
        structured = generate_topic_explanation(topic)
        return jsonify({"ok": True, "data": structured})
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Topic explanation failed: {exc}"}), 500


@api_bp.get("/quiz/question")
def quiz_question():
    topic = request.args.get("topic", "")
    try:
        question = get_quiz_question(topic)
        return jsonify({"ok": True, "data": question})
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Quiz fetch failed: {exc}"}), 500
