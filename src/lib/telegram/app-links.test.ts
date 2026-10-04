import { describe, expect, it } from "vitest";
import { appLinks, itemPath } from "./app-links";

describe("appLinks", () => {
  const links = [{ text: "Открыть желание", path: itemPath("item 1") }];

  it("на https-адрес даёт кнопки и не дублирует ссылку в тексте", () => {
    expect(appLinks(links, "https://wish.example.com/")).toEqual({
      lines: [],
      replyMarkup: {
        inline_keyboard: [
          [{ text: "Открыть желание", url: "https://wish.example.com/?item=item%201" }],
        ],
      },
    });
  });

  it("на http в домашней сети пишет ссылку текстом: такую кнопку Telegram отклонит", () => {
    expect(appLinks(links, "http://192.168.1.10:4030")).toEqual({
      lines: ["Открыть желание: http://192.168.1.10:4030/?item=item%201"],
    });
  });

  it("без адреса приложения ссылок нет", () => {
    expect(appLinks(links, "")).toEqual({ lines: [] });
  });
});
