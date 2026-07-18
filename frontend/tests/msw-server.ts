import { setupServer } from "msw/node";

import { createFoundationHandlers } from "../src/mocks/handlers/foundation.ts";

export const mockServer = setupServer(...createFoundationHandlers());
