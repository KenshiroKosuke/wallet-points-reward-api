import { EntityManager, EntityRepository, LoadStrategy, MikroORM, Options } from "@mikro-orm/postgresql";
import { User } from "./user.entity.js";
import { loadMikroOrmConfig } from "./mikro-orm.config.js";
import { appConfigs } from "src/configs/app.config.js";
import { Reward } from "./reward.entity.js";
import { Currency } from "./currency.entity.js";
import { Wallet } from "./wallet.entity.js";
import { PointLog } from "./pointLog.entity.js";
import { PointRewardLog } from "./pointRewardLog.js";

export interface Services {
  orm: MikroORM;
  em: EntityManager;
  currency: EntityRepository<Currency>;
  user: EntityRepository<User>;
  wallet: EntityRepository<Wallet>;
  reward: EntityRepository<Reward>;
  pointLog: EntityRepository<PointLog>;
  pointRewardLog: EntityRepository<PointRewardLog>;
}

let cache: Services;

export async function getORM() {
  if (cache) {
    return cache;
  }
  return await initORM();
}

export async function initORM(): Promise<Services> {
  if (cache) {
    return cache;
  }
  const schemaName =
    appConfigs.node.nodeEnv === "development"
      ? "point_exchange_dev_2"
      : `mikro_orm_test_${(Math.random() + 1).toString(36).substring(2)}`;
  const orm = await initORMPostgreSql(schemaName);
  // save to cache before returning
  return (cache = {
    orm,
    em: orm.em,
    currency: orm.em.getRepository(Currency),
    user: orm.em.getRepository(User),
    reward: orm.em.getRepository(Reward),
    wallet: orm.em.getRepository(Wallet),
    pointLog: orm.em.getRepository(PointLog),
    pointRewardLog: orm.em.getRepository(PointRewardLog),
  });
}

export async function initORMPostgreSql(schemaName: string, loadStrategy = LoadStrategy.SELECT_IN) {
  const mikroOrmConfig = loadMikroOrmConfig();
  const orm = await MikroORM.init({
    ...mikroOrmConfig,
    // entities: [ User ,...entities],
    schema: schemaName,
    debug: ["query", "query-params"],
    forceUtcTimezone: true,
    autoJoinOneToOneOwner: false,
    // logger: i => i,
    // metadataCache: { enabled: true },
    // migrations: { path: BASE_DIR + '/../temp/migrations', snapshot: false },
    loadStrategy,
  });

  // const generator = orm.schema;
  // const createDump = await generator.getCreateSchemaSQL();
  // console.log(createDump);
  // await orm.schema.updateSchema(); // CREATE NEW SCHEMA EVERY TIME
  // await orm.seeder.seed(TestSeeder);
  // await orm.schema.ensureDatabase();
  // const connection = orm.em.getConnection();
  // await connection.loadFile(DIR_NAME + '/postgres-schema.sql');
  return orm;
}

export async function deleteSchema() {}
