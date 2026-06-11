import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/errors", () => ({ logSupabaseError: vi.fn() }));
vi.mock("@/lib/validation/sanitize", () => ({
  sanitizeText: vi.fn((v: unknown) => String(v ?? "")),
  sanitizedString: vi.fn(),
}));

import { assignSchoolsToUnit } from "@/app/actions/schools";
import { assignCompaniesToUnit } from "@/app/actions/companies";

const UNIT = "550e8400-e29b-41d4-a716-446655440000";
const ID1 = "550e8400-e29b-41d4-a716-446655440001";
const ID2 = "550e8400-e29b-41d4-a716-446655440002";

function mockClient({
  user = { id: "u1" } as { id: string } | null,
  unit = { id: UNIT } as { id: string } | null,
  updateResult = { error: null as unknown, count: 2 },
} = {}) {
  const inMock = vi.fn(async () => updateResult);
  const updateMock = vi.fn(() => ({ in: inMock }));
  const from = vi.fn((table: string) => {
    if (table === "units") {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: unit }) }) }) };
    }
    return { update: updateMock };
  });
  return {
    client: { auth: { getUser: async () => ({ data: { user } }) }, from },
    updateMock,
    inMock,
  };
}

describe("assignSchoolsToUnit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejeita lista vazia", async () => {
    createClientMock.mockResolvedValue(mockClient().client);
    const res = await assignSchoolsToUnit([], UNIT);
    expect(res.success).toBeUndefined();
    expect(res.message).toBe("Selecione ao menos uma escola.");
  });

  it("rejeita unidade inexistente", async () => {
    createClientMock.mockResolvedValue(mockClient({ unit: null }).client);
    const res = await assignSchoolsToUnit([ID1], UNIT);
    expect(res.message).toBe("Unidade inválida.");
  });

  it("associa escolas e retorna a contagem", async () => {
    const m = mockClient({ updateResult: { error: null, count: 2 } });
    createClientMock.mockResolvedValue(m.client);
    const res = await assignSchoolsToUnit([ID1, ID2], UNIT);
    expect(res.success).toBe(true);
    expect(res.updated).toBe(2);
    expect(res.message).toContain("associada");
    expect(m.updateMock).toHaveBeenCalled();
    expect(m.inMock).toHaveBeenCalledWith("id", [ID1, ID2]);
  });

  it("desassocia (unitId null) sem checar unidade", async () => {
    const m = mockClient({ updateResult: { error: null, count: 1 } });
    createClientMock.mockResolvedValue(m.client);
    const res = await assignSchoolsToUnit([ID1], null);
    expect(res.success).toBe(true);
    expect(res.message).toContain("removida");
    // não deve consultar a tabela units quando unitId é null
    expect(m.client.from).not.toHaveBeenCalledWith("units");
  });
});

describe("assignCompaniesToUnit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejeita lista vazia", async () => {
    createClientMock.mockResolvedValue(mockClient().client);
    const res = await assignCompaniesToUnit([], UNIT);
    expect(res.message).toBe("Selecione ao menos uma empresa.");
  });

  it("associa empresas e retorna a contagem", async () => {
    const m = mockClient({ updateResult: { error: null, count: 3 } });
    createClientMock.mockResolvedValue(m.client);
    const res = await assignCompaniesToUnit([ID1, ID2], UNIT);
    expect(res.success).toBe(true);
    expect(res.updated).toBe(3);
    expect(res.message).toContain("associada");
  });
});
