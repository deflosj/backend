import { generateKeyPairSync, createVerify } from "node:crypto";
import { sendViaGmail } from "../utils/gmail";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

const cfg = {
  serviceAccountJson: JSON.stringify({ client_email: "mailer@proj.iam.gserviceaccount.com", private_key: pem }),
  sender: "info@deflosj.be",
  from: "De Flosj <info@deflosj.be>",
};

const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

describe("sendViaGmail", () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("vraagt een token als de sender en stuurt een geldige MIME-mail", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "tok", expires_in: 3600 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "1" }) });

    await sendViaGmail(cfg, {
      to: "kapitein@example.com",
      subject: "Inschrijving bevestigd — ploeg Café",
      text: "Hallo é",
      html: "<p>Hallo é</p>",
      replyTo: "info@deflosj.be",
    });

    // 1. Token: JWT met sub = sender, correct ondertekend
    const tokenBody = fetchMock.mock.calls[0][1].body as URLSearchParams;
    const [h, c, sig] = tokenBody.get("assertion")!.split(".");
    const claims = JSON.parse(fromB64url(c).toString());
    expect(claims.sub).toBe("info@deflosj.be");
    expect(claims.scope).toBe("https://www.googleapis.com/auth/gmail.send");
    const v = createVerify("RSA-SHA256");
    v.update(`${h}.${c}`);
    expect(v.verify(publicKey, fromB64url(sig))).toBe(true);

    // 2. Mail: juiste endpoint, token, en MIME met encoded subject + beide delen
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toContain("/users/info%40deflosj.be/messages/send");
    expect(init.headers.Authorization).toBe("Bearer tok");
    const mime = fromB64url(JSON.parse(init.body).raw).toString();
    expect(mime).toContain("To: kapitein@example.com");
    expect(mime).toContain("Reply-To: info@deflosj.be");
    expect(mime).toMatch(/Subject: =\?UTF-8\?B\?/);
    expect(mime).toContain("multipart/alternative");
    expect(mime).toContain("text/plain");
    expect(mime).toContain("text/html");
  });

  it("hergebruikt het token en geeft Gmail-fouten door", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400, statusText: "Bad", json: async () => ({ error: { message: "Invalid To header" } }) });
    await expect(sendViaGmail(cfg, { to: "x", subject: "s", text: "t" })).rejects.toThrow("Gmail 400: Invalid To header");
    expect(fetchMock).toHaveBeenCalledTimes(1); // geen nieuwe token-call
  });
});
