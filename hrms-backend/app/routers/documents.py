from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.document import DocumentVault
from app.models.recruitment import Application
from app.services.storage_service import storage_service
from app.dependencies import get_current_user
from app.models.user import User
import uuid
import PyPDF2
import io
import mimetypes

router = APIRouter()

@router.post("/upload/{employee_id}")
async def upload_document(
    employee_id: str,
    document_type: str = Form(...),
    notes: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        content = await file.read()
        content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        
        ext = file.filename.split(".")[-1] if "." in file.filename else ""
        file_path = f"{employee_id}/{document_type}/{uuid.uuid4()}.{ext}"
        
        # Upload to 'documents' bucket
        storage_service.upload_file("documents", file_path, content, content_type)
        
        doc = DocumentVault(
            employee_id=employee_id,
            document_type=document_type,
            file_name=file.filename,
            file_url=file_path,  # Store path instead of public URL for private bucket
            file_size=len(content),
            uploaded_by=current_user.id,
            notes=notes
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        return {
            "id": doc.id,
            "file_url": doc.file_url,
            "document_type": doc.document_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{employee_id}")
def get_documents(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(DocumentVault).filter(DocumentVault.employee_id == employee_id).all()
    grouped = {}
    for doc in docs:
        if doc.document_type not in grouped:
            grouped[doc.document_type] = []
        
        # Get signed URL for preview
        try:
            signed_url = storage_service.get_signed_url("documents", doc.file_url)
        except Exception:
            signed_url = None
            
        grouped[doc.document_type].append({
            "id": doc.id,
            "file_name": doc.file_name,
            "file_url": signed_url,
            "file_size": doc.file_size,
            "uploaded_by": doc.uploaded_by,
            "notes": doc.notes,
            "created_at": doc.created_at
        })
    return grouped

@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "HR"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    doc = db.query(DocumentVault).filter(DocumentVault.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        storage_service.delete_file("documents", doc.file_url)
    except Exception as e:
        print(f"Failed to delete from storage: {e}")
        
    db.delete(doc)
    db.commit()
    return {"status": "success"}

@router.post("/upload-resume/{application_id}")
async def upload_resume(
    application_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    try:
        content = await file.read()
        content_type = file.content_type or "application/pdf"
        ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
        file_path = f"{application_id}/{uuid.uuid4()}.{ext}"
        
        storage_service.upload_file("resumes", file_path, content, content_type)
        
        # Extract text if PDF
        resume_text = ""
        if ext.lower() == "pdf":
            try:
                reader = PyPDF2.PdfReader(io.BytesIO(content))
                for page in reader.pages:
                    resume_text += page.extract_text() + "\n"
            except Exception as e:
                print(f"PyPDF2 extraction error: {e}")
                
        app.resume_url = file_path
        if resume_text:
            app.resume_text = resume_text.strip()
            
        db.commit()
        
        return {
            "file_url": file_path,
            "extracted_text_length": len(resume_text)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{doc_id}")
def download_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(DocumentVault).filter(DocumentVault.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    signed_url = storage_service.get_signed_url("documents", doc.file_url, expires_in=3600)
    return RedirectResponse(url=signed_url)
