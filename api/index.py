import sys
import os

# Add the backend 'src' folder to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend", "src"))

from mtc.main import app

# Vercel looks for `app`