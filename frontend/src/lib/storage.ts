// Client-side storage utilities for passing data between pages

export interface StoredFileData {
  fileName: string;
  fileSize: number;
  uploadTime: number;
}

export function storeFileData(file: File): void {
  const data: StoredFileData = {
    fileName: file.name,
    fileSize: file.size,
    uploadTime: Date.now(),
  };
  sessionStorage.setItem('uploadedFile', JSON.stringify(data));
  
  // Store the actual file in a way that can be retrieved
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      sessionStorage.setItem('uploadedFileContent', e.target.result as string);
    }
  };
  reader.readAsDataURL(file);
}

export function getStoredFileData(): StoredFileData | null {
  const data = sessionStorage.getItem('uploadedFile');
  return data ? JSON.parse(data) : null;
}

export async function getStoredFile(): Promise<File | null> {
  const fileData = getStoredFileData();
  const fileContent = sessionStorage.getItem('uploadedFileContent');
  
  if (!fileData || !fileContent) return null;
  
  // Convert base64 back to File
  const response = await fetch(fileContent);
  const blob = await response.blob();
  return new File([blob], fileData.fileName, { type: blob.type });
}

export function clearStoredFile(): void {
  sessionStorage.removeItem('uploadedFile');
  sessionStorage.removeItem('uploadedFileContent');
}