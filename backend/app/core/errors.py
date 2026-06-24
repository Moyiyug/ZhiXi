from fastapi import HTTPException


class NotFoundError(HTTPException):
    def __init__(self, detail: str = "Not found", code: str = "NOT_FOUND"):
        super().__init__(status_code=404, detail={"detail": detail, "code": code})


class ValidationError(HTTPException):
    def __init__(self, detail: str = "Validation error", code: str = "VALIDATION_ERROR"):
        super().__init__(status_code=422, detail={"detail": detail, "code": code})


class ServiceError(HTTPException):
    def __init__(self, detail: str = "Service error", code: str = "SERVICE_ERROR"):
        super().__init__(status_code=500, detail={"detail": detail, "code": code})
