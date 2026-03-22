import "dotenv/config";
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from "@playwright/test";

const E2E_USERNAME = process.env.SEED_USER1_USERNAME || "user1";
const E2E_PASSWORD = process.env.SEED_USER1_PASSWORD || "changeme";

async function createAuthenticatedApiContext(): Promise<APIRequestContext> {
  const api = await playwrightRequest.newContext({
    baseURL: process.env.E2E_BASE_URL || "http://localhost:4030",
  });

  const csrfResponse = await api.get("/api/auth/csrf");
  expect(csrfResponse.status()).toBe(200);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  expect(typeof csrfToken).toBe("string");
  expect(csrfToken.length).toBeGreaterThan(0);

  const candidates: Array<{ username: string; password: string }> = [
    { username: E2E_USERNAME, password: E2E_PASSWORD },
    { username: "user1", password: "changeme" },
  ];

  let authenticated = false;
  const authErrors: string[] = [];
  for (const candidate of candidates) {
    const authIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const signInResponse = await api.post("/api/auth/callback/credentials", {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-for": authIp,
      },
      form: {
        csrfToken,
        username: candidate.username,
        password: candidate.password,
        callbackUrl: "/",
        json: "true",
      },
    });

    const signInText = await signInResponse.text();
    if (![200, 302].includes(signInResponse.status())) {
      authErrors.push(
        `signIn status=${signInResponse.status()} user=${candidate.username} body=${signInText.slice(0, 180)}`
      );
      continue;
    }

    const sessionResponse = await api.get("/api/auth/session");
    if (sessionResponse.status() !== 200) {
      const sessionText = await sessionResponse.text();
      authErrors.push(
        `session status=${sessionResponse.status()} user=${candidate.username} body=${sessionText.slice(0, 180)}`
      );
      continue;
    }

    const session = (await sessionResponse.json()) as { user?: { id?: string } };
    if (session.user?.id) {
      authenticated = true;
      break;
    }
    authErrors.push(`session empty user for ${candidate.username}: ${JSON.stringify(session)}`);
  }

  expect(authenticated, authErrors.join("\n")).toBe(true);

  return api;
}

test.describe("security hardening regressions", () => {
  test.describe.configure({ mode: "serial" });

  test("throttles brute-force credentials callback with 429", async ({ request }) => {
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
    let responseStatus = 0;

    for (let attempt = 1; attempt <= 6; attempt++) {
      const response = await request.post("/api/auth/callback/credentials", {
        headers: {
          "x-forwarded-for": ip,
          "content-type": "application/x-www-form-urlencoded",
        },
        form: {
          username: `attacker-${attempt}`,
          password: "wrong-password",
          csrfToken: "e2e-placeholder",
          callbackUrl: "/",
          json: "true",
        },
      });

      responseStatus = response.status();
      if (responseStatus === 429) {
        break;
      }
    }

    expect(responseStatus).toBe(429);
  });

  test("rejects self password change without currentPassword", async () => {
    const api = await createAuthenticatedApiContext();

    const meResponse = await api.get("/api/users/me");
    expect(meResponse.status()).toBe(200);
    expect(meResponse.headers()["content-type"]).toContain("application/json");
    const meBody = (await meResponse.json()) as { id: string };
    expect(typeof meBody.id).toBe("string");
    expect(meBody.id.length).toBeGreaterThan(0);

    const passwordResponse = await api.patch(`/api/users/${meBody.id}/password`, {
      data: { password: "NewStrongPassword1!" },
    });

    expect(passwordResponse.status()).toBe(400);
    expect(passwordResponse.headers()["content-type"]).toContain("application/json");
    await expect(passwordResponse.json()).resolves.toMatchObject({
      error: "Для смены пароля укажите текущий пароль",
    });

    await api.dispose();
  });

  test("rejects avatarUrl that is not from whitelist", async () => {
    const api = await createAuthenticatedApiContext();

    const response = await api.patch("/api/users/me", {
      data: {
        avatarUrl: "https://evil.example/avatar.png",
      },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()["content-type"]).toContain("application/json");
    await expect(response.json()).resolves.toMatchObject({
      error: "Некорректный avatarUrl",
    });

    await api.dispose();
  });
});
