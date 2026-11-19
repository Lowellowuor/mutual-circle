import sys
import os

# Add the 'src' directory to the Python path for Vercel
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from mtc.main import app

# Vercel looks for `app`