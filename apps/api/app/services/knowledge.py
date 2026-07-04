import json
import re
from pathlib import Path
from typing import Optional, List, Dict
from app.config import settings
from app.schemas.predict import Advice

class KnowledgeService:
    def __init__(self):
        self.knowledge_path = settings.BASE_DIR.parent.parent.parent / "CROP" / "knowledge" / "knowledge_base.json"
        self._data = self._load_data()
        # Build a normalized lookup index for fuzzy matching
        self._index = self._build_index()

    def _load_data(self) -> dict:
        if not self.knowledge_path.exists():
            print(f"Knowledge base not found at {self.knowledge_path}.")
            return {}
        with open(self.knowledge_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _normalize(self, name: str) -> str:
        """Normalize a class name for fuzzy matching."""
        # "Tomato___Early_blight" -> "early blight tomato"
        # "Early blight (Tomato)" -> "early blight tomato"
        name = name.replace("___", " ").replace("_", " ")
        name = re.sub(r'[(),]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip().lower()
        # Sort words for order-independent matching
        return " ".join(sorted(name.split()))

    def _build_index(self) -> dict:
        """Build an index mapping normalized keys to original keys."""
        index = {}
        for key in self._data:
            norm = self._normalize(key)
            index[norm] = key
        return index

    def get_advice(self, class_name: str) -> Optional[Advice]:
        """
        Look up advice for a class name. Supports multiple formats:
        - Exact match: "Early blight (Tomato)"
        - PlantVillage format: "Tomato___Early_blight"
        - Underscore format: "Tomato_Early_blight"
        - Any order: "Tomato Early blight" matches "Early blight (Tomato)"
        """
        # Try exact match first
        data = self._data.get(class_name)
        if data:
            return Advice(**data)

        # Try normalized fuzzy match
        norm = self._normalize(class_name)
        original_key = self._index.get(norm)
        if original_key:
            return Advice(**self._data[original_key])

        # Try partial match: check if any key contains the class name or vice versa
        class_lower = class_name.lower().replace("_", " ").replace("___", " ")
        for key, value in self._data.items():
            key_lower = key.lower()
            if class_lower in key_lower or key_lower in class_lower:
                return Advice(**value)

        return None

knowledge_service = KnowledgeService()
