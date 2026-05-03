from __future__ import annotations

import random
from typing import Any
class QuizService:
    def get_question(self, topic):
        return {
            "question": f"Sample question on {topic}",
            "options": ["A", "B", "C", "D"],
            "answer": "A",
            "explanation": "Because..."
        }

QUIZ_BANK: dict[str, list[dict[str, Any]]] = {
    "electrochemistry": [
        {
            "question": "Where does oxidation occur in a galvanic cell?",
            "options": ["Anode", "Cathode", "Salt bridge", "Electrolyte only"],
            "answer": "Anode",
            "explanation": "Oxidation is loss of electrons, and it occurs at the anode.",
        },
        {
            "question": "Which variable directly appears in the Nernst equation reaction quotient term?",
            "options": ["Q", "Ksp", "pKa", "Delta H only"],
            "answer": "Q",
            "explanation": "The Nernst equation explicitly uses the reaction quotient Q.",
        },
    ],
    "thermodynamics": [
        {
            "question": "What does a negative Delta G indicate?",
            "options": ["Spontaneous process", "Impossible process", "Endothermic only", "Zero entropy"],
            "answer": "Spontaneous process",
            "explanation": "At constant T and P, negative Delta G indicates spontaneous direction.",
        }
    ],
    "chirality": [
        {
            "question": "A carbon center is chiral when it has:",
            "options": ["Four different substituents", "Two identical substituents", "A double bond", "No hydrogen atoms"],
            "answer": "Four different substituents",
            "explanation": "A tetrahedral atom with four different groups is typically chiral.",
        }
    ],
    "materials science": [
        {
            "question": "The slope of the initial stress-strain curve represents:",
            "options": ["Young's modulus", "Yield stress", "Ultimate strength", "Poisson ratio"],
            "answer": "Young's modulus",
            "explanation": "In the elastic region, slope = E (Young's modulus).",
        }
    ],
}


def get_quiz_question(topic: str) -> dict[str, Any]:
    normalized = (topic or "").strip().lower()
    topic_pool = QUIZ_BANK.get(normalized)
    if not topic_pool:
        topic_pool = [
            {
                "question": f"What is the core idea behind {topic or 'chemistry'}?",
                "options": ["Structure-property relation", "Random behavior", "No measurable trends", "Only memorization"],
                "answer": "Structure-property relation",
                "explanation": "Chemistry and materials science often connect structure with observable properties.",
            }
        ]
    return random.choice(topic_pool)
