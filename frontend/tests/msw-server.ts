import { setupServer } from "msw/node";

import { createFoundationHandlers } from "../src/mocks/handlers/foundation.ts";
import { createMarkrHandlers } from "../src/mocks/handlers/markr.ts";

export const mockServer = setupServer(...createFoundationHandlers(), ...createMarkrHandlers());
