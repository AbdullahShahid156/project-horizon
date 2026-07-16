import json
import re
from typing import Any


class OutputParser:
    """Parses and validates structured AI outputs."""

    @staticmethod
    def parse_json(text: str) -> dict[str, Any] | None:
        """Parse JSON from AI response text, handling common issues."""
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1])

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            repaired = OutputParser.repair_json(cleaned)
            return repaired

    @staticmethod
    def repair_json(text: str) -> dict | list | None:
        """Attempt to repair malformed JSON."""
        repairs = [
            text.rstrip(","),
            re.sub(r",\s*}", "}", text),
            re.sub(r",\s*]", "]", text),
            re.sub(r"[^\x00-\x7F]+", "", text),
            "{" + text.split("{", 1)[-1].rsplit("}", 1)[0] + "}",
            "[" + text.split("[", 1)[-1].rsplit("]", 1)[0] + "]",
        ]
        for attempt in repairs:
            try:
                return json.loads(attempt)
            except json.JSONDecodeError:
                continue
        return None

    @staticmethod
    def validate_structure(data: dict, schema: dict[str, Any]) -> list[str]:
        """Validate that data matches expected structure."""
        errors = []
        for key, expected_type in schema.items():
            if key not in data:
                errors.append(f"Missing required field: {key}")
                continue
            if expected_type == "str" and not isinstance(data[key], str):
                errors.append(f"Field '{key}' should be a string")
            elif expected_type == "list" and not isinstance(data[key], list):
                errors.append(f"Field '{key}' should be a list")
            elif expected_type == "dict" and not isinstance(data[key], dict):
                errors.append(f"Field '{key}' should be a dict")
            elif expected_type == "number" and not isinstance(data[key], (int, float)):
                errors.append(f"Field '{key}' should be a number")
        return errors

    @staticmethod
    def ensure_string_fields(data: dict, fields: list[str]) -> dict:
        """Ensure specified fields are strings."""
        result = dict(data)
        for field in fields:
            if field in result and not isinstance(result[field], str):
                result[field] = str(result[field])
        return result

    @staticmethod
    def ensure_list_fields(data: dict, fields: list[str]) -> dict:
        """Ensure specified fields are lists."""
        result = dict(data)
        for field in fields:
            if field not in result:
                result[field] = []
            elif not isinstance(result[field], list):
                result[field] = [result[field]]
        return result

    @staticmethod
    def extract_json_from_text(text: str) -> dict | list | None:
        """Extract JSON from mixed text content."""
        json_pattern = r"```json\s*(.*?)\s*```"
        match = re.search(json_pattern, text, re.DOTALL)
        if match:
            return OutputParser.parse_json(match.group(1))

        brace_pattern = r"\{.*\}"
        match = re.search(brace_pattern, text, re.DOTALL)
        if match:
            return OutputParser.parse_json(match.group(0))

        bracket_pattern = r"\[.*\]"
        match = re.search(bracket_pattern, text, re.DOTALL)
        if match:
            return OutputParser.parse_json(match.group(0))

        return None
