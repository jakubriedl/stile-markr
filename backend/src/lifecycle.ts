export interface StoppableServer {
  readonly stop: (closeActiveConnections?: boolean) => Promise<void>;
}

export function createGracefulShutdown(server: StoppableServer) {
  let isClosing = false;

  return async function closeServer(): Promise<void> {
    if (isClosing) {
      return;
    }

    isClosing = true;
    await server.stop(false);
  };
}
