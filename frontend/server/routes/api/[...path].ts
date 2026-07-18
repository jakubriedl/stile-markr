import { defineHandler } from "h3";

import { proxyApiRequest } from "../../../src/lib/api/proxy.server.ts";

export default defineHandler((event) => {
  const path = event.url.pathname.replace(/^\/api\/?/, "");
  return proxyApiRequest(event.req, path);
});
