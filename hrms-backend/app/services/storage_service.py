import uuid
from supabase import create_client, Client
from app.config import settings

class StorageService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    def upload_file(self, bucket: str, path: str, file_bytes: bytes, content_type: str) -> str:
        """
        Uploads a file to Supabase Storage.
        Returns the public URL (if public) or just a reference path.
        """
        self.supabase.storage.from_(bucket).upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": content_type}
        )
        return self.supabase.storage.from_(bucket).get_public_url(path)

    def delete_file(self, bucket: str, path: str):
        """
        Deletes a file from Supabase Storage.
        """
        self.supabase.storage.from_(bucket).remove([path])

    def get_signed_url(self, bucket: str, path: str, expires_in: int = 3600) -> str:
        """
        Returns a temporary signed URL for a private file.
        """
        res = self.supabase.storage.from_(bucket).create_signed_url(path, expires_in)
        return res.get("signedURL") or res.get("signedUrl") or res

storage_service = StorageService()
