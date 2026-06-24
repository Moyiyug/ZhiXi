from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.event import CurrentEventProfile, ProfileRequest

router = APIRouter(prefix="/api", tags=["events"])


@router.post("/events/profile")
def generate_profile(body: ProfileRequest, session: Session = Depends(get_session)) -> CurrentEventProfile:
    from app.services.profile_service import ProfileService

    svc = ProfileService(session)
    return svc.generate_profile(body.event_text, body.manual_hints)
