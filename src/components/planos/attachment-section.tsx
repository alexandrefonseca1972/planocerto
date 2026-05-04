"use client";

import { useState, useRef, useEffect } from "react";
import { uploadAttachment, deleteAttachment, getAttachments, getAttachmentUrl } from "@/app/actions/attachments";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Download, FileText, Image as ImageIcon } from "lucide-react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function isImage(mime: string): boolean {
  return mime.startsWith("image/");
}

export function AttachmentSection({ itemId }: { itemId: string }) {
  const [attachments, setAttachments] = useState<{ id: string; filename: string; storage_path: string; size: number; mime_type: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemId) {
      getAttachments(itemId).then(setAttachments).finally(() => setLoading(false));
    }
  }, [itemId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    const result = await uploadAttachment(itemId, file);
    if (result.success) {
      const updated = await getAttachments(itemId);
      setAttachments(updated);
    } else {
      setError(result.message || "Erro ao enviar.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    await deleteAttachment(id);
    const updated = await getAttachments(itemId);
    setAttachments(updated);
  };

  const handleDownload = async (path: string, _filename: string) => {
    const url = await getAttachmentUrl(path);
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500">Anexos ({attachments.length})</span>
        <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" accept="image/*,.pdf,.xlsx,.xls,.csv,.svg" />
        <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs h-7">
          <Paperclip className="h-3 w-3 mr-1" />
          {uploading ? "Enviando..." : "Anexar"}
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {loading ? (
        <p className="text-xs text-zinc-400">Carregando...</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-zinc-400">Nenhum anexo.</p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {attachments.map(a => (
            <div key={a.id} className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 dark:border-zinc-700 text-xs">
              {isImage(a.mime_type) ? <ImageIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" /> : <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />}
              <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">{a.filename}</span>
              <span className="text-zinc-400 shrink-0">{formatSize(a.size)}</span>
              <button type="button" onClick={() => handleDownload(a.storage_path, a.filename)} className="text-zinc-400 hover:text-blue-500" title="Download">
                <Download className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => handleDelete(a.id)} className="text-zinc-400 hover:text-red-500" title="Remover">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
