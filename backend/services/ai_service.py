from __future__ import annotations

import os
import json
from typing import Any

from .topic_data import TOPIC_CONTENT, TOPIC_SYNONYMS
import google.generativeai as genai


# =========================
# 🔥 AI SMILES GENERATOR (FIXED)
# =========================
def generate_smiles_from_name(name: str) -> str | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-pro")

    prompt = f"""
    Convert this chemical name into a valid SMILES string.

    Name: {name}

    Return ONLY the SMILES string. No explanation.
    """

    try:
        response = model.generate_content(prompt)

        if hasattr(response, "text") and response.text:
            return response.text.strip()

        try:
            return response.candidates[0].content.parts[0].text.strip()
        except Exception:
            return None

    except Exception:
        return None


# =========================
# 🔥 GEMINI CHAT
# =========================
def chat_with_gemini(user_message: str) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {
            "concept": "API key missing",
            "explanation": "Set GEMINI_API_KEY",
            "visualization": "",
            "example": "",
            "application": ""
        }

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-pro")

    prompt = f"""
    Explain this chemistry topic clearly and in structured format.

    Question: {user_message}

    Return STRICTLY in JSON format:
    {{
        "concept": "...",
        "explanation": "...",
        "visualization": "...",
        "example": "...",
        "application": "..."
    }}
    """

    try:
        response = model.generate_content(prompt)

        text = ""
        if hasattr(response, "text") and response.text:
            text = response.text
        else:
            try:
                text = response.candidates[0].content.parts[0].text
            except Exception:
                return {
                    "concept": "No response from Gemini",
                    "explanation": "",
                    "visualization": "",
                    "example": "",
                    "application": ""
                }

        try:
            parsed = json.loads(text)
            return {
                "concept": parsed.get("concept", ""),
                "explanation": parsed.get("explanation", ""),
                "visualization": parsed.get("visualization", ""),
                "example": parsed.get("example", ""),
                "application": parsed.get("application", ""),
            }

        except Exception:
            sections = {
                "concept": "",
                "explanation": "",
                "visualization": "",
                "example": "",
                "application": ""
            }

            current = None
            for line in text.split("\n"):
                line = line.strip()

                if line.lower().startswith("concept"):
                    current = "concept"
                elif line.lower().startswith("explanation"):
                    current = "explanation"
                elif line.lower().startswith("visualization"):
                    current = "visualization"
                elif line.lower().startswith("example"):
                    current = "example"
                elif line.lower().startswith("application"):
                    current = "application"
                elif current:
                    sections[current] += line + " "

            return sections

    except Exception as e:
        return {
            "concept": f"Error: {str(e)}",
            "explanation": "",
            "visualization": "",
            "example": "",
            "application": ""
        }


# =========================
# 🔹 TOPIC EXPLANATION
# =========================
def _normalize_topic(topic: str) -> str:
    key = topic.strip().lower()
    return TOPIC_SYNONYMS.get(key, key)


def generate_topic_explanation(topic: str) -> dict[str, str]:
    normalized = _normalize_topic(topic)
    data = TOPIC_CONTENT.get(normalized)

    if data:
        return {
            "topic": topic,
            "unit": data["unit"],
            "concept": data["concept"],
            "explanation": data["deep_explanation"],
            "visualization": data["visualization"],
            "example": f"Example: {data['concept']}",
            "application": data["real_world_application"],
        }

    return {
        "topic": topic,
        "unit": "Custom Topic",
        "concept": f"{topic} is an important chemistry concept.",
        "explanation": f"{topic} can be explored using structure, thermodynamics, and kinetics.",
        "visualization": f"Imagine breaking {topic} into particles and interactions.",
        "example": f"Example: Lab setup where {topic} affects results.",
        "application": f"Used in materials, energy, and healthcare.",
    }


# =========================
# 🔥 MAIN CHAT ROUTER
# =========================
def chat_with_ai(user_message: str, topic_context=None) -> dict[str, Any]:
    return chat_with_gemini(user_message)


# =========================
# 🔥 SERVICE CLASS
# =========================
class AIService:
    def chat(self, message: str, topic: str | None = None) -> dict[str, Any]:
        return chat_with_ai(message)