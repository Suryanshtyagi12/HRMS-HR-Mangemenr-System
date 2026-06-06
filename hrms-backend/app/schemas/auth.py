from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str   # email (OAuth2 form field name)
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str
