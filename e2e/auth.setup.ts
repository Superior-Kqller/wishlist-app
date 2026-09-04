import fs from "node:fs";
import { test as setup } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";

const AUTH_STATE = "playwright/.auth/user.json";

/**
 * Один вход на весь прогон — и по возможности на несколько прогонов подряд.
 *
 * `/api/auth` пускает пять попыток входа за пятнадцать минут на IP
 * (`rateLimitPresets.auth`), а в наборе было семнадцать вызовов
 * `loginAsUser`: полный прогон упирался в собственную защиту приложения и
 * разваливался на третьем файле, причём с ошибками, похожими на баги
 * интерфейса. Теперь состояние сессии снимается один раз, переиспользуется
 * между запусками и обновляется только когда действительно протухло.
 */
setup("сохранить состояние входа", async ({ page, playwright, baseURL }) => {
  if (fs.existsSync(AUTH_STATE)) {
    const probe = await playwright.request.newContext({ baseURL, storageState: AUTH_STATE });
    const response = await probe.get("/api/users/me");
    await probe.dispose();
    if (response.ok()) return;
  }

  await loginAsUser(page);
  fs.mkdirSync("playwright/.auth", { recursive: true });
  await page.context().storageState({ path: AUTH_STATE });
});
