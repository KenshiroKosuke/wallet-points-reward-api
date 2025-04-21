import { FastifyCorsOptions } from "@fastify/cors";

const nodeEnvTypes = ["development", "production", "test"] as const;
type NodeEnvType = (typeof nodeEnvTypes)[number];
function isNodeEnvType(value: string): value is NodeEnvType {
  return (nodeEnvTypes as readonly string[]).includes(value);
}

export type AppConfigs = {
  node: {
    nodeEnv: NodeEnvType;
  };
  server: {
    host: string;
    port: number;
    corsOptions: FastifyCorsOptions
  };
  auth: {
    jwtSecret: string;
    dbSecret: string;
  };
  db: {
    uri: string;
  };
};

function initAppConfigs(): AppConfigs {
  let nodeEnvTmp = String(process.env.NODE_ENV).toLowerCase();
  const nodeEnv: NodeEnvType = isNodeEnvType(nodeEnvTmp)
    ? nodeEnvTmp
    : "development";
  return {
    node: {
      nodeEnv: nodeEnv,
    },
    server: {
      host: process.env.SERVER_HOST ?? "localhost",
      port: parseInt(process.env.SERVER_PORT ?? "3000", 10),
      corsOptions: {
        origin: (process.env.SERVER_CORS ?? "").split(",").map((s) => {
          try {
            return new RegExp(s);
          } catch (error) {
            return s;
          }
        }),
        methods: ["GET", "PUT", "POST"],
        credentials: true,
      }
    },
    auth: {
      jwtSecret: process.env.AUTH_JWT_SECRET ?? "pls_replace_secret",
      dbSecret: process.env.AUTH_JWT_SECRET ?? "pls_replace_secret",
    },
    db: {
      uri: process.env.DB_URI ?? "pls_replace_db_connection_uri",
    },
  };
}

export const appConfigs: AppConfigs = initAppConfigs();
