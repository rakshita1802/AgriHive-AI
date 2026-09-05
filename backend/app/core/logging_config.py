"""
AgriHive AI - Structured JSON Logging & Correlation ID Middleware.

Provides:
- JSON log formatter outputting timestamp, log level, correlation_id, module, and message
- FastAPI request middleware generating/forwarding X-Correlation-ID across requests
"""
import json
import logging
import uuid
import contextvars
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Context variable for holding request-scoped correlation ID
correlation_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("correlation_id", default="-")


class JSONStructuredLogFormatter(logging.Formatter):
    """Formats log records as structured JSON strings."""

    def format(self, record: logging.LogRecord) -> str:
        log_object = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "correlation_id": correlation_id_var.get(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }

        if record.exc_info:
            log_object["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_object)


def setup_structured_logging(level=logging.INFO):
    """Initialize structured JSON logging for root logger."""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Clear existing handlers
    root_logger.handlers.clear()

    handler = logging.StreamHandler()
    handler.setFormatter(JSONStructuredLogFormatter())
    root_logger.addHandler(handler)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """FastAPI Middleware attaching unique X-Correlation-ID header to every request."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        corr_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        token = correlation_id_var.set(corr_id)

        response: Response = await call_next(request)
        response.headers["X-Correlation-ID"] = corr_id

        correlation_id_var.reset(token)
        return response
