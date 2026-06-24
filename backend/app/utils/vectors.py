import numpy as np


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.asarray(a, dtype=np.float32)
    vb = np.asarray(b, dtype=np.float32)
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
    if denom == 0:
        return 0.0
    raw = float(np.dot(va, vb) / denom)
    return max(0.0, min(1.0, (raw + 1.0) / 2.0))
