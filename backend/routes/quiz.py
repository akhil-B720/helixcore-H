from flask import Blueprint, request, jsonify
from backend.services.quiz_service import QuizService

quiz_bp = Blueprint("quiz", __name__)
quiz_service = QuizService()

@quiz_bp.route("/quiz/question", methods=["GET"])
def get_question():
    topic = request.args.get("topic")
    return jsonify(quiz_service.get_question(topic))