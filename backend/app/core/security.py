"""
Security & Authentication utilities.

Provides password hashing/validation and JWT token generation & verification.
"""
import base64
import hashlib
import hmac
import json
import time
from typing import Any, Dict, Optional

SECRET_KEY = "agrihive_secret_key_rbac_jwt_signature_2026"
ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 86400 * 7  # 7 days


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with secret salt."""
    salt = "agrihive_salt_9988"
    salted = f"{salt}:{password}".encode("utf-8")
    return hashlib.sha256(salted).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored hash."""
    return hash_password(plain_password) == hashed_password


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(payload: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    """Create a signed JWT token."""
    header = {"alg": ALGORITHM, "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))

    token_payload = payload.copy()
    exp_time = int(time.time()) + (expires_delta or TOKEN_EXPIRE_SECONDS)
    token_payload["exp"] = exp_time

    payload_b64 = _base64url_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))

    signature_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signature_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify a signed JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts

        signature_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signature_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp") and time.time() > payload["exp"]:
            return None

        return payload
    except Exception:
        return None
