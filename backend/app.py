from __future__ import annotations

import os
from pathlib import Path

from backend.routes.topic import topic_bp

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

# ❌ REMOVED api_bp (causing route conflict)
# from backend.routes.api import api_bp

from backend.routes.analysis import analysis_bp
from backend.routes.chat import chat_bp


def create_app() -> Flask:
    project_root = Path(__file__).resolve().parent.parent
    frontend_dir = project_root / "frontend"

    app = Flask(__name__, static_folder=str(frontend_dir), static_url_path="")
    CORS(app)

    # ===== REGISTER BLUEPRINTS =====
    # ❌ REMOVED this line (causing /api/chat not found)
    # app.register_blueprint(api_bp)

    app.register_blueprint(analysis_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(topic_bp, url_prefix="/api")
    # ===== HEALTH CHECK =====
    @app.route("/api/health")
    def health():
        return jsonify({"ok": True})

    # ===== SERVE FRONTEND =====
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def static_files(path: str):
        full = os.path.join(app.static_folder, path)
        if os.path.exists(full):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    # ===== ERROR HANDLERS =====
    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"ok": False, "error": "Not found"}), 404

    @app.errorhandler(500)
    def internal_error(_):
        return jsonify({"ok": False, "error": "Internal server error"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug, host="0.0.0.0", port=port)