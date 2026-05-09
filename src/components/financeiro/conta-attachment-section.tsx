"use client";

import { useState, useRef, useEffect } from "react";
import {
  uploadAnexoConta,
  deleteAnexo,
  listarAnexos,
  getAnexoUrl,
} from "@/app/actions/contas-pagar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Paperclip,
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Receipt,
  Banknote,
  FileSignature,
  FileCheck,
  HandCoins,
  FileQuestion,
} from "lucide-react";
import {
  ANEXO_TIPOS,
  ANEXO_TIPO_LABELS,
  type AnexoTipo,
  type ContaAttachment,
} from "@/types/financeiro";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function isImage(mime: string): boolean {
  return mime.startsWith("image/");
}

function tipoIcon(tipo: AnexoTipo) {
  switch (tipo) {
    case "nf":
      return Receipt;
    case "recibo":
      return HandCoins;
    case "contrato":
      return FileSignature;
    case "boleto":
      return Banknote;
    case "comprovante":
      return FileCheck;
    default:
      return FileQuestion;
  }
}

const tipoBadgeColor: Record<AnexoTipo, string> = {
  nf: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  recibo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  contrato: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  boleto: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  comprovante: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  outro: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function ContaAttachmentSection({ contaId }: { contaId: string }) {
  const [attachments, setAttachments] = useState<ContaAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [tipo, setTipo] = useState<AnexoTipo>("nf");
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (contaId) {
      listarAnexos(contaId)
        .then(setAttachments)
        .finally(() => setLoading(false));
    }
  }, [contaId]);

  // Carrega URLs assinadas para imagens (thumbnail inline).
  useEffect(() => {
    let cancelled = false;
    const imageAtts = attachments.filter((a) => isImage(a.mime_type));
    for (const a of imageAtts) {
      if (thumbs[a.id] !== undefined) continue;
      getAnexoUrl(a.storage_path).then((url) => {
        if (cancelled) return;
        setThumbs((prev) => ({ ...prev, [a.id]: url }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [attachments, thumbs]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const result = await uploadAnexoConta(contaId, file, tipo);
    if (result.success) {
      const updated = await listarAnexos(contaId);
      setAttachments(updated);
    } else {
      setError(result.message || "Erro ao enviar.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(id: string) {
    await deleteAnexo(id);
    const updated = await listarAnexos(contaId);
    setAttachments(updated);
    setThumbs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleDownload(path: string) {
    const url = await getAnexoUrl(path);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-zinc-500 mr-auto">
          Anexos ({attachments.length})
        </span>
        <Select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as AnexoTipo)}
          className="h-8 w-40 text-xs"
          aria-label="Tipo de documento"
        >
          {ANEXO_TIPOS.map((t) => (
            <option key={t} value={t}>
              {ANEXO_TIPO_LABELS[t]}
            </option>
          ))}
        </Select>
        <input
          ref={fileRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
          accept="image/*,.pdf,.xlsx,.xls,.csv,.svg"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs h-8"
        >
          <Paperclip className="h-3 w-3 mr-1" />
          {uploading ? "Enviando..." : "Anexar"}
        </Button>
      </div>

      <p className="text-[11px] text-zinc-400">
        Selecione o tipo do documento antes de anexar (NF, recibo, contrato, boleto, comprovante).
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {loading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800/50"
            />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-700">
          <FileText className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Nenhum anexo ainda
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            Anexe NF, recibo, contrato ou comprovante de pagamento.
          </p>
        </div>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {attachments.map((a) => {
            const Icon = tipoIcon(a.tipo);
            const thumb = thumbs[a.id];
            return (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 dark:border-zinc-700 text-xs"
              >
                {isImage(a.mime_type) && thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={a.filename}
                    className="h-8 w-8 rounded object-cover shrink-0 cursor-pointer"
                    onClick={() => handleDownload(a.storage_path)}
                  />
                ) : isImage(a.mime_type) ? (
                  <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <Icon className="h-4 w-4 text-zinc-500 shrink-0" />
                )}
                <Badge
                  variant="outline"
                  className={`shrink-0 border-0 px-1.5 text-[10px] py-0 ${tipoBadgeColor[a.tipo]}`}
                >
                  {ANEXO_TIPO_LABELS[a.tipo] || ANEXO_TIPO_LABELS.outro}
                </Badge>
                <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
                  {a.filename}
                </span>
                <span className="text-zinc-400 shrink-0">
                  {formatSize(a.size)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDownload(a.storage_path)}
                  className="text-zinc-400 hover:text-blue-500"
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="text-zinc-400 hover:text-red-500"
                  title="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
