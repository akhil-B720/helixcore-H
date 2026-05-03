from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from backend.services.ai_service import generate_smiles_from_name
import requests

try:
    from rdkit import Chem
    from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors
except ImportError:
    Chem = None
    AllChem = None
    Descriptors = None
    rdMolDescriptors = None


PUBCHEM_CID_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{name}/cids/JSON"
PUBCHEM_SMILES_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/CanonicalSMILES/JSON"


@dataclass
class MoleculeAnalysisResult:
    name: str | None
    smiles: str
    molecular_formula: str
    molecular_weight: float
    functional_groups: list[str]
    chirality_centers: list[dict[str, Any]]
    stereochemistry_info: str
    mol_block_3d: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "smiles": self.smiles,
            "molecular_formula": self.molecular_formula,
            "molecular_weight": round(self.molecular_weight, 4),
            "functional_groups": self.functional_groups,
            "chirality_centers": self.chirality_centers,
            "stereochemistry_info": self.stereochemistry_info,
            "mol_block_3d": self.mol_block_3d,
        }


def _resolve_smiles_from_name(name: str) -> str | None:
    try:
        name = name.strip().lower()

        cid_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{name}/cids/JSON"
        cid_response = requests.get(cid_url, timeout=5)

        if cid_response.status_code != 200:
            return None

        cid_data = cid_response.json()
        cid_list = cid_data.get("IdentifierList", {}).get("CID", [])

        if not cid_list:
            return None

        cid = cid_list[0]

        smiles_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/CanonicalSMILES/JSON"
        smiles_response = requests.get(smiles_url, timeout=5)

        if smiles_response.status_code != 200:
            return None

        smiles_data = smiles_response.json()
        props = smiles_data.get("PropertyTable", {}).get("Properties", [])

        if not props:
            return None

        return props[0].get("CanonicalSMILES")

    except Exception:
        return None


def _detect_functional_groups(smiles: str) -> list[str]:
    patterns = {
        "Alcohol": "[OX2H]",
        "Carboxylic Acid": "C(=O)[OX2H1]",
        "Amine": "[NX3;H2,H1;!$(NC=O)]",
        "Amide": "C(=O)N",
        "Ester": "C(=O)O[#6]",
        "Aromatic Ring": "a1aaaaa1",
        "Alkene": "C=C",
        "Alkyne": "C#C",
        "Halide": "[F,Cl,Br,I]",
    }

    if Chem is None:
        return []

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return []

    groups = []
    for label, smarts in patterns.items():
        query = Chem.MolFromSmarts(smarts)
        if query and mol.HasSubstructMatch(query):
            groups.append(label)

    return groups


def analyze_molecule(name: str | None, smiles: str | None) -> MoleculeAnalysisResult:
    if Chem is None or AllChem is None or Descriptors is None or rdMolDescriptors is None:
        raise RuntimeError("RDKit is not installed.")

    final_smiles = (smiles or "").strip()
    final_name = (name or "").strip() or None

    # 🔥 FIXED: CORRECTLY INSIDE FUNCTION
    if not final_smiles and final_name:
        final_smiles = _resolve_smiles_from_name(final_name) or ""

        # 🔥 AI fallback
        if not final_smiles:
            ai_smiles = generate_smiles_from_name(final_name)
            if ai_smiles:
                final_smiles = ai_smiles.strip()

    if not final_smiles:
        raise ValueError(
            f"Could not resolve molecule '{final_name}'. Try simpler name or use SMILES."
        )

    mol = Chem.MolFromSmiles(final_smiles)
    if mol is None:
        raise ValueError("Invalid SMILES.")

    mol = Chem.AddHs(mol)

    if AllChem.EmbedMolecule(mol, AllChem.ETKDG()) != 0:
        raise ValueError("3D generation failed.")

    AllChem.UFFOptimizeMolecule(mol, maxIters=200)

    chiral_centers = Chem.FindMolChiralCenters(
        mol, includeUnassigned=True, useLegacyImplementation=False
    )

    chirality = [
        {"atom_index": idx, "configuration": config}
        for idx, config in chiral_centers
    ]

    stereo_summary = (
        "No chiral centers detected."
        if not chirality
        else f"{len(chirality)} center(s): "
             + ", ".join(f"{c['atom_index']}={c['configuration']}" for c in chirality)
    )

    return MoleculeAnalysisResult(
        name=final_name,
        smiles=final_smiles,
        molecular_formula=rdMolDescriptors.CalcMolFormula(mol),
        molecular_weight=Descriptors.MolWt(mol),
        functional_groups=_detect_functional_groups(final_smiles),
        chirality_centers=chirality,
        stereochemistry_info=stereo_summary,
        mol_block_3d=Chem.MolToMolBlock(mol),
    )


class MoleculeService:
    def analyze(self, name=None, smiles=None):
        result = analyze_molecule(name, smiles).to_dict()

        return {
            "formula": result["molecular_formula"],
            "weight": result["molecular_weight"],
            "functional_groups": result["functional_groups"],
            "chirality": result["chirality_centers"],
            "stereochemistry_info": result["stereochemistry_info"],
            "mol_block": result["mol_block_3d"],
        }