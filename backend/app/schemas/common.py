from pydantic import BaseModel


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int


class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str] = []
