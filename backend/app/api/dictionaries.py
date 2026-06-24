from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.dictionary import DictionaryResponse

router = APIRouter(prefix="/api", tags=["dictionaries"])


@router.get("/dictionaries")
def get_dictionaries(session: Session = Depends(get_session)) -> DictionaryResponse:
    from app.services.dictionary_service import get_dictionaries as svc_get_dicts

    data = svc_get_dicts(session)
    return DictionaryResponse(**data)
