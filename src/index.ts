import { buildApp } from "#/app.js";
import { appConfigs } from "src/configs/app.config.js";

async function bootstrap() {
  const server = await buildApp({
    logger: {
      level: "debug",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    },
    connectionTimeout: 30000,
  });
  server.listen({ host: appConfigs.server.host, port: appConfigs.server.port }, function (err, address) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.log(`Server listening in ${appConfigs.node.nodeEnv} at ${address}`);
  });
  server.ready(() => {
    console.log(server.printRoutes());
  });
  const listeners = ["SIGINT", "SIGTERM"];
  listeners.forEach((signal) => {
    process.on(signal, async () => {
      await server.close();
      process.exit(0);
    });
  });
}

bootstrap();
