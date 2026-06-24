import re
from io import BytesIO

import pandas as pd
from sqlmodel import Session

from app.models.case import Case
from app.utils.normalize import json_dumps_list, split_comma_field

COLUMN_MAP = {
    "案例编号": "case_code",
    "事件名称": "title",
    "公众诉求": "public_demands_raw",
    "热度等级": "heat_level_text",
    "回应速度": "response_speed",
    "处置效果": "effect_score_text",
    "策略逻辑类型": "strategy_types_raw",
    "事件核心描述": "event_description",
    "核心处置策略": "strategy_text",
    "备注": "notes",
}


def _clean_cell(value):
    if isinstance(value, float) and value != value:
        return None
    if isinstance(value, str):
        v = value.strip()
        if v.lower() == "nan" or v == "":
            return None
        return v
    return value


def _extract_number(text: str | None) -> int | None:
    if not text:
        return None
    m = re.search(r"(\d+)", text)
    return int(m.group(1)) if m else None


def import_csv_from_bytes(content: bytes, session: Session) -> dict:
    df = pd.read_csv(BytesIO(content), header=None, skiprows=3)
    df = df.drop(columns=[c for c in df.columns if "Unnamed" in str(c)], errors="ignore")
    rows = df.values.tolist()
    imported = 0
    skipped = 0
    errors: list[str] = []
    for i, row in enumerate(rows):
        try:
            if not row or len(row) < 2:
                skipped += 1
                continue
            case_code_val = _clean_cell(row[0])
            title_val = _clean_cell(row[1])
            if not title_val:
                skipped += 1
                continue

            public_demands_raw = _clean_cell(row[2]) if len(row) > 2 else None
            heat_level_text = _clean_cell(row[3]) if len(row) > 3 else None
            response_speed = _clean_cell(row[4]) if len(row) > 4 else None
            effect_score_text = _clean_cell(row[5]) if len(row) > 5 else None
            strategy_types_raw = _clean_cell(row[6]) if len(row) > 6 else None

            event_desc = _clean_cell(row[24]) if len(row) > 24 else ""
            strategy_text = _clean_cell(row[25]) if len(row) > 25 else ""
            notes = _clean_cell(row[26]) if len(row) > 26 else None

            public_demands = split_comma_field(public_demands_raw)
            strategy_types = split_comma_field(strategy_types_raw)
            heat_level = _extract_number(heat_level_text) or 3
            effect_score = _extract_number(effect_score_text)

            case = Case(
                case_code=case_code_val,
                title=title_val,
                domain="其他",
                public_demands_json=json_dumps_list(public_demands),
                heat_level=heat_level,
                response_speed=response_speed,
                effect_score=effect_score,
                strategy_types_json=json_dumps_list(strategy_types),
                event_description=event_desc or "",
                strategy_text=strategy_text or "",
                notes=notes,
                enabled=True,
                embedding_status="none",
            )
            session.add(case)
            session.commit()
            imported += 1
        except Exception as e:
            errors.append(f"Row {i + 4}: {e}")
    return {"imported": imported, "skipped": skipped, "errors": errors}
