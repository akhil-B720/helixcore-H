from flask import Blueprint, request, jsonify
from backend.services.molecule_service import MoleculeService

analysis_bp = Blueprint("analysis", __name__)

service = MoleculeService()


@analysis_bp.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json(silent=True) or {}

        name = (data.get("name") or "").strip()
        smiles = (data.get("smiles") or "").strip()

        if not name and not smiles:
            return jsonify({
                "ok": False,
                "error": "Provide molecule name or SMILES"
            }), 400

        result = service.analyze(name=name, smiles=smiles)

        return jsonify({
            "ok": True,
            "data": result
        })

    except Exception as e:
        return jsonify({
            "ok": False,
            "error": str(e)
        }), 500