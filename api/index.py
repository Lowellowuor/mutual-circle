import sys
import os

# Add the backend 'src' folder to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend", "src"))

from mtc.main import app as fastapi_app

async def app(scope, receive, send):
    if scope["type"] in ("http", "websocket") and scope.get("path", "").startswith("/api"):
        scope = dict(scope)
        new_path = scope["path"][4:] or "/"
        scope["path"] = new_path
        scope["raw_path"] = new_path.encode("utf-8")
    await fastapi_app(scope, receive, send)