import os
import sys
import traceback

print("Testing Parsing Packages...")

# 1. Test unstructured
try:
    from unstructured.partition.pdf import partition_pdf
    print("✅ unstructured[pdf] imported successfully.")
except Exception as e:
    print("❌ unstructured[pdf] failed to import:", e)
    traceback.print_exc()

# 2. Test pytesseract
try:
    import pytesseract
    print("✅ pytesseract imported successfully.")
except Exception as e:
    print("❌ pytesseract failed to import:", e)
    traceback.print_exc()

# 3. Test camelot-py
try:
    import camelot
    print("✅ camelot-py imported successfully.")
except Exception as e:
    print("❌ camelot-py failed to import:", e)
    traceback.print_exc()

# 4. Test PyMuPDF
try:
    import fitz
    print(f"✅ PyMuPDF (fitz) imported successfully. Version: {fitz.version[0]}")
except Exception as e:
    print("❌ PyMuPDF (fitz) failed to import:", e)
    traceback.print_exc()

# 5. Test pandas
try:
    import pandas as pd
    print(f"✅ pandas imported successfully. Version: {pd.__version__}")
except Exception as e:
    print("❌ pandas failed to import:", e)
    traceback.print_exc()

# 6. Test openpyxl
try:
    import openpyxl
    print(f"✅ openpyxl imported successfully. Version: {openpyxl.__version__}")
except Exception as e:
    print("❌ openpyxl failed to import:", e)
    traceback.print_exc()
