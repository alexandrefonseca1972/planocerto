import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { GET } from "@/app/api/notifications/unread/route";

const client = (user: unknown, count = 0) => ({
  auth: { getUser: async () => ({ data: { user } }) },
  rpc: async () => ({ data: count, error: null }),
});

describe("GET /api/notifications/unread", () => {
  beforeEach(() => createClientMock.mockReset());

  it("401 sem usuário", async () => {
    createClientMock.mockResolvedValue(client(null));
    expect((await GET()).status).toBe(401);
  });

  it("retorna count, no-store", async () => {
    createClientMock.mockResolvedValue(client({ id: "u" }, 3));
    const res = await GET();
    expect(await res.json()).toEqual({ count: 3 });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
