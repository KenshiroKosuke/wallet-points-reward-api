import { Options, PostgreSqlDriver, ReflectMetadataProvider } from "@mikro-orm/postgresql";
import { appConfigs } from "src/configs/app.config.js";

// make it a function to load during runtime
export const loadMikroOrmConfig = () => {
  const ormConfig: Options = {
    driver: PostgreSqlDriver,
    clientUrl: appConfigs.db.uri,
    metadataProvider: ReflectMetadataProvider,
    // folder-based discovery setup, using common filename suffix
    entities: ["dist/entities/**/*.entity.js"],
    entitiesTs: ["src/entities/**/*.entity.ts"],
    discovery: {
      warnWhenNoEntities: true,
    },
    forceUtcTimezone: true, // force the Dates to be saved in UTC in datetime columns without timezone.
    // baseDir: process.cwd(),
    // findOneOrFailHandler: foundOneOrFailErrorHandler,
    dynamicImportProvider: (id) => import(id),
  };
  return ormConfig;
};

// export default loadMikroOrmConfig();
