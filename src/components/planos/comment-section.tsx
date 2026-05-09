"use client";

import { useState, useEffect } from "react";
import { addComment, getComments, deleteComment } from "@/app/actions/shared";
import { Button } from "@/components/ui/button";
import { sanitize } from "@/lib/sanitize";
import { MessageSquare, Send, Trash2 } from "lucide-react";

type Comment = { id: string; content: string; user_id: string; author: string; created_at: string };

function fmtRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min atrás`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h atrás`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d atrás`;
  return date.toLocaleDateString("pt-BR");
}

export function CommentSection({ itemId }: { itemId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (itemId) {
      getComments(itemId).then(setComments).finally(() => setLoading(false));
    }
  }, [itemId]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError("");
    const result = await addComment(itemId, trimmed);
    if (result.success && result.comment) {
      setContent("");
      setComments(prev => [...prev, result.comment!]);
    } else {
      setError(result.message || "Erro ao comentar.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
    const result = await deleteComment(id);
    if (!result.success) {
      const updated = await getComments(itemId);
      setComments(updated);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-xs font-semibold text-zinc-500">Comentários ({comments.length})</span>
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={e => setContent(sanitize(e.target.value))}
          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Escreva um comentário... (Ctrl+Enter para enviar)"
          rows={1}
          maxLength={2000}
          disabled={submitting}
          className="flex-1 min-h-[36px] max-h-32 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs leading-snug shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-y"
        />
        <Button type="button" size="sm" disabled={submitting || !content.trim()} onClick={handleSubmit} isLoading={submitting} className="h-9 px-3 shrink-0">
          {!submitting && <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {loading ? (
        <p className="text-xs text-zinc-400">Carregando...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-zinc-400 italic">Nenhum comentário ainda.</p>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
          {comments.map(c => (
            <div key={c.id} className="rounded-md border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800/40 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-200 truncate">{c.author}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-zinc-400">{fmtRelative(c.created_at)}</span>
                  <button type="button" onClick={() => handleDelete(c.id)} className="text-zinc-400 hover:text-red-500 transition-colors" title="Remover">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap break-words leading-snug">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
