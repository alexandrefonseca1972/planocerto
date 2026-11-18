import { describe, it, expect, vi, beforeEach } from "vitest";

const r2 = vi.hoisted(() => ({
  r2Put: vi.fn(async () => true),
  r2Delete: vi.fn(async () => true),
  r2SignedDownloadUrl: vi.fn(async () => "https://signed"),
}));
vi.mock("@/lib/r2", () => r2);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Resultado devolvido por tabela/operação no cliente Supabase simulado.
let db: { item: unknown; insertError: unknown; deleted: unknown[]; readable: unknown };

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: (table: string) => {
      const q: Record<string, unknown> = {};
      const chain = () => q;
      Object.assign(q, {
        select: chain,
        eq: chain,
        single: async () => ({ data: table === "action_items" ? db.item : null }),
        maybeSingle: async () => ({ data: db.readable }),
        insert: async () => ({ error: db.insertError }),
        delete: () => ({ eq: () => ({ select: async () => ({ data: db.deleted, error: null }) }) }),
      });
      return q;
    },
  }),
}));

import { uploadAttachment, deleteAttachment, getAttachmentUrl } from "@/app/actions/attachments";

const pdf = () => new File(["x"], "a.pdf", { type: "application/pdf" });

describe("anexos de plano no R2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db = { item: { plan_id: "p1" }, insertError: null, deleted: [], readable: null };
  });

  it("upload grava no R2 e registra", async () => {
    expect((await uploadAttachment("i1", pdf())).success).toBe(true);
    expect(r2.r2Put).toHaveBeenCalledOnce();
    expect(r2.r2Delete).not.toHaveBeenCalled();
  });

  it("falha no registro apaga o arquivo enviado (#9)", async () => {
    db.insertError = { message: "rls" };
    expect((await uploadAttachment("i1", pdf())).success).toBeUndefined();
    expect(r2.r2Delete).toHaveBeenCalledWith("plan-attachments", expect.stringMatching(/^i1\//));
  });

  it("item inacessível não envia nada", async () => {
    db.item = null;
    await uploadAttachment("i1", pdf());
    expect(r2.r2Put).not.toHaveBeenCalled();
  });

  it("exclusão sem linha removida (RLS) não apaga o arquivo", async () => {
    expect((await deleteAttachment("a1")).success).toBeUndefined();
    expect(r2.r2Delete).not.toHaveBeenCalled();
  });

  it("exclusão remove o registro e depois o arquivo", async () => {
    db.deleted = [{ storage_path: "i1/1-a.pdf" }];
    expect((await deleteAttachment("a1")).success).toBe(true);
    expect(r2.r2Delete).toHaveBeenCalledWith("plan-attachments", "i1/1-a.pdf");
  });

  it("link assinado só para anexo que a RLS deixa ler", async () => {
    expect(await getAttachmentUrl("outra-empresa/x.pdf")).toBeNull();
    expect(r2.r2SignedDownloadUrl).not.toHaveBeenCalled();
    db.readable = { storage_path: "i1/1-a.pdf", filename: "a.pdf" };
    expect(await getAttachmentUrl("i1/1-a.pdf")).toBe("https://signed");
  });
});
