import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetcher } from "./fetcher";

describe("fetcher", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("возвращает JSON при успешном ответе", async () => {
    const data = { items: [1, 2, 3] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await fetcher("/api/items");
    expect(result).toEqual(data);
    expect(fetch).toHaveBeenCalledWith("/api/items");
  });

  it("выбрасывает ошибку при неуспешном ответе", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetcher("/api/items")).rejects.toThrow("Ошибка загрузки");
  });
});
