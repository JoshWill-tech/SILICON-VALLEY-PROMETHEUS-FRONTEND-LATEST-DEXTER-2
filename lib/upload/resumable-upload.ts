// lib/upload/resumable-upload.ts
import { get, set, del } from 'idb-keyval';

export interface UploadSession {
  uploadId: string;
  key: string;
  parts: { ETag: string; PartNumber: number }[];
  fileId: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadFileResumable(
  file: File,
  projectId: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const fileId = `upload-${projectId}-${file.name}-${file.size}`;
  let session = await get<UploadSession>(fileId);

  if (!session) {
    // Initiate new multipart upload
    const res = await fetch(`/api/projects/${projectId}/upload-multipart/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    if (!res.ok) throw new Error('Failed to initiate upload');
    const data = await res.json();
    session = { uploadId: data.uploadId, key: data.key, parts: [], fileId };
    await set(fileId, session);
  }

  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  
  for (let partNumber = session.parts.length + 1; partNumber <= totalParts; partNumber++) {
    const start = (partNumber - 1) * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    // Get signed URL for this part
    const signRes = await fetch(`/api/projects/${projectId}/upload-multipart/sign-part`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        uploadId: session.uploadId, 
        key: session.key, 
        partNumber 
      }),
    });
    if (!signRes.ok) throw new Error(`Failed to sign part ${partNumber}`);
    const { url } = await signRes.json();

    // Upload the part
    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: chunk,
    });
    if (!uploadRes.ok) throw new Error(`Failed to upload part ${partNumber}`);
    
    const etag = uploadRes.headers.get('ETag');
    if (!etag) throw new Error(`Missing ETag for part ${partNumber}`);

    session.parts.push({ ETag: etag.replace(/"/g, ''), PartNumber: partNumber });
    await set(fileId, session);

    onProgress((partNumber / totalParts) * 100);
  }

  // Complete the multipart upload
  const completeRes = await fetch(`/api/projects/${projectId}/upload-multipart/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId: session.uploadId,
      key: session.key,
      parts: session.parts,
    }),
  });
  if (!completeRes.ok) throw new Error('Failed to complete upload');
  
  const finalData = await completeRes.json();
  await del(fileId);
  
  return finalData.url;
}
