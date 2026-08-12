import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renderiza a landing final em português", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Movimento Volta Pra Você/);
  assert.match(html, /Em que momento da vida/);
  assert.match(html, /diagnóstico gratuito/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("mantém contas, produtos e jornadas individuais no código final", async () => {
  const [quiz, result, member, admin, dataRoute, schema, readme] = await Promise.all([
    readFile(new URL("components/QuizExperience.tsx", root), "utf8"),
    readFile(new URL("components/ResultPage.tsx", root), "utf8"),
    readFile(new URL("components/MemberApp.tsx", root), "utf8"),
    readFile(new URL("components/AdminDashboard.tsx", root), "utf8"),
    readFile(new URL("app/api/data/route.ts", root), "utf8"),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("README.md", root), "utf8"),
  ]);
  assert.match(quiz, /quizQuestions\.length/);
  assert.match(result, /checkoutHref|pagamento/);
  assert.match(member, /Diário|checkin|community/);
  assert.match(admin, /Gestão de leads|Automações/);
  assert.match(dataRoute, /requireIdentity|canUse|admin\.access/);
  assert.match(schema, /userProfiles|userAccess|entitlementClaims|notificationOutbox/);
  assert.match(readme, /Contas individuais|Privacidade e segurança/);
});

test("usa login próprio por e-mail e senha sem depender de conta externa", async () => {
  const [loginPage, loginForm, setupForm, auth, loginRoute, passwordRoute, requestLink, demoRoute, adminPage] = await Promise.all([
    readFile(new URL("app/entrar/page.tsx", root), "utf8"),
    readFile(new URL("components/PasswordLoginForm.tsx", root), "utf8"),
    readFile(new URL("components/PasswordSetupForm.tsx", root), "utf8"),
    readFile(new URL("lib/auth.ts", root), "utf8"),
    readFile(new URL("app/api/auth/login/route.ts", root), "utf8"),
    readFile(new URL("app/api/auth/set-password/route.ts", root), "utf8"),
    readFile(new URL("app/api/auth/request-link/route.ts", root), "utf8"),
    readFile(new URL("app/api/demo-auth/route.ts", root), "utf8"),
    readFile(new URL("app/admin/page.tsx", root), "utf8"),
  ]);
  const source = [loginPage, loginForm, setupForm, auth, loginRoute, passwordRoute, requestLink, demoRoute, adminPage].join("\n");
  assert.match(source, /Criar ou recuperar senha|createPasswordCredential|verifyPassword/);
  assert.match(source, /PBKDF2|600_000|HttpOnly|SameSite=Lax/);
  assert.match(source, /activation|reset|auth_login_tokens/);
  assert.match(source, /DEMO_ADMIN_EMAIL|demo-admin|Acesse o painel/);
  assert.doesNotMatch(source, /chatgpt|signin-with|oai-authenticated/i);
});
