import json

from sqlmodel import Session, func, select

from app.core.errors import NotFoundError
from app.models.case import Case, CaseEmbedding
from app.schemas.case import CaseCreate, CaseResponse, CaseUpdate
from app.utils.normalize import json_dumps_list


class CaseService:
    def __init__(self, session: Session):
        self.session = session

    def list_cases(self, q=None, domain=None, enabled=None, embedding_status=None, page=1, page_size=20):
        stmt = select(Case)
        if q:
            stmt = stmt.where(Case.title.contains(q))
        if domain:
            stmt = stmt.where(Case.domain == domain)
        if enabled is not None:
            stmt = stmt.where(Case.enabled == enabled)
        if embedding_status:
            stmt = stmt.where(Case.embedding_status == embedding_status)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.session.exec(count_stmt).one()
        stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(Case.updated_at.desc())
        cases = self.session.exec(stmt).all()
        return {
            "items": self._to_responses(cases),
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    def create(self, data: CaseCreate) -> CaseResponse:
        case = Case(
            case_code=data.case_code,
            title=data.title,
            domain=data.domain,
            public_demands_json=json_dumps_list(data.public_demands),
            heat_level=data.heat_level,
            response_speed=data.response_speed,
            effect_score=data.effect_score,
            strategy_types_json=json_dumps_list(data.strategy_types),
            event_description=data.event_description,
            strategy_text=data.strategy_text,
            vertical_subject=data.vertical_subject,
            carrier_target=data.carrier_target,
            trigger_reason=data.trigger_reason,
            risk_tags_json=json_dumps_list(data.risk_tags),
            notes=data.notes,
            enabled=True,
            embedding_status="none",
        )
        self.session.add(case)
        self.session.commit()
        self.session.refresh(case)
        return self._to_response(case)

    def get(self, case_id: int) -> CaseResponse:
        case = self.session.get(Case, case_id)
        if not case:
            raise NotFoundError("Case not found", "CASE_NOT_FOUND")
        return self._to_response(case, include_embedding=True)

    def update(self, case_id: int, data: CaseUpdate) -> CaseResponse:
        case = self.session.get(Case, case_id)
        if not case:
            raise NotFoundError("Case not found", "CASE_NOT_FOUND")
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            if k in ("public_demands", "strategy_types", "risk_tags"):
                setattr(case, f"{k}_json", json_dumps_list(v or []))
            elif hasattr(case, k):
                setattr(case, k, v)
        case.embedding_status = "none"
        self.session.add(case)
        self.session.commit()
        self.session.refresh(case)
        return self._to_response(case)

    def delete(self, case_id: int) -> None:
        case = self.session.get(Case, case_id)
        if not case:
            raise NotFoundError("Case not found", "CASE_NOT_FOUND")
        stmt = select(CaseEmbedding).where(CaseEmbedding.case_id == case_id)
        for emb in self.session.exec(stmt).all():
            self.session.delete(emb)
        self.session.delete(case)
        self.session.commit()

    def toggle(self, case_id: int) -> CaseResponse:
        case = self.session.get(Case, case_id)
        if not case:
            raise NotFoundError("Case not found", "CASE_NOT_FOUND")
        case.enabled = not case.enabled
        self.session.add(case)
        self.session.commit()
        self.session.refresh(case)
        return self._to_response(case)

    def _to_response(self, case: Case, include_embedding: bool = False) -> CaseResponse:
        embedding_text = None
        embedding_model = None
        embedding_dimensions = None
        if include_embedding:
            emb = self.session.exec(
                select(CaseEmbedding).where(CaseEmbedding.case_id == case.id)
            ).first()
            if emb:
                embedding_text = emb.embedding_text
                embedding_model = emb.model_name
                embedding_dimensions = emb.dimensions
        return CaseResponse(
            id=case.id,
            case_code=case.case_code,
            title=case.title,
            domain=case.domain,
            public_demands=json.loads(case.public_demands_json),
            heat_level=case.heat_level,
            response_speed=case.response_speed,
            effect_score=case.effect_score,
            strategy_types=json.loads(case.strategy_types_json),
            event_description=case.event_description,
            strategy_text=case.strategy_text,
            vertical_subject=case.vertical_subject,
            carrier_target=case.carrier_target,
            trigger_reason=case.trigger_reason,
            risk_tags=json.loads(case.risk_tags_json),
            notes=case.notes,
            enabled=case.enabled,
            embedding_status=case.embedding_status,
            embedding_text=embedding_text,
            embedding_model=embedding_model,
            embedding_dimensions=embedding_dimensions,
            created_at=case.created_at,
            updated_at=case.updated_at,
        )

    def _to_responses(self, cases: list[Case]) -> list[CaseResponse]:
        return [self._to_response(c) for c in cases]
