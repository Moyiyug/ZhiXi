import json
import re


def normalize_case_row(row: dict) -> dict:
    for k, v in list(row.items()):
        if isinstance(v, float) and v != v:  # NaN check
            row[k] = None
        elif v == "" or v == "nan":
            row[k] = None
    return row


def split_comma_field(value: str | None) -> list[str]:
    if not value:
        return []
    return [s.strip() for s in re.split(r"[,，、/]", value) if s.strip()]


def json_dumps_list(items: list[str] | None) -> str:
    return json.dumps(items or [], ensure_ascii=False)


def extract_domain_from_row(row: dict) -> str:
    layer2_prefixes = {
        "文化传播类": "【第二层：文化传播类】",
        "思想政治教育类": "【第二层：思想政治教育类】",
        "政府管理类": "【第二层：政府管理类】",
        "技术分析类": "【第二层：技术分析类】",
    }
    for domain, prefix in layer2_prefixes.items():
        cols = [k for k in row if k.startswith(prefix) and row[k] is not None]
        if cols:
            return domain
    return "其他"
