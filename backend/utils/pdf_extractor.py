import PyPDF2
from typing import Optional

def extract_text_from_pdf(pdf_file) -> str:
    """
    Extract text from a PDF file.
    
    Args:
        pdf_file: File object or path to PDF
        
    Returns:
        Extracted text as string
    """
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def validate_complaint_text(text: str) -> bool:
    """
    Basic validation to ensure the extracted text is not empty
    and contains legal complaint indicators.
    
    Args:
        text: Extracted text
        
    Returns:
        True if valid, False otherwise
    """
    if not text or len(text.strip()) < 100:
        return False
    
    # Check for common legal complaint indicators
    indicators = ["complaint", "plaintiff", "defendant", "paragraph"]
    text_lower = text.lower()
    
    return any(indicator in text_lower for indicator in indicators)