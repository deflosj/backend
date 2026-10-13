import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../../app";
import config from "../../config";

/**
 * De app met de API-prefix (standaard /api) al ingevuld, zodat tests gewoon
 * `request(app).get("/tournaments")` kunnen schrijven.
 */
export function createTestApp() {
  const app = createApp();
  return (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? "";
    if (!url.startsWith(`${config.apiPrefix}/`)) req.url = `${config.apiPrefix}${url}`;
    app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
  };
}
