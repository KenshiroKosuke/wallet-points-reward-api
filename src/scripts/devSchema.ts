// console.log(process.argv);

import { getORM } from "src/entities/database.js";
import { seedDatabase } from "src/entities/seed.js";

async function start() {
  if (process.argv.length < 3) {
    return;
  }
  const command = process.argv[2];
  console.log("[STARTED] command =>",command);
  const db = await getORM();
  switch (command) {
    case "schema:clear": {
      await db.orm.schema.clearDatabase();
      break;
    }
    case "schema:seed": {
      await seedDatabase();
      break;
    }
    case "schema:update": {
      await db.orm.schema.updateSchema();
      break;
    }
    default: {
      console.log("[ERROR] wrong command!");
      await db.orm.close();
      return;
    }
  }
  await db.orm.close();
  console.log("[COMPLETED]",command);
  return;
}

start();
