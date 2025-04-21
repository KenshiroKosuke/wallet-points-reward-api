import "reflect-metadata"
// INSERT INTO point_exchange_dev_2."user" ("uuid",created_at,updated_at,username,"password",organization_id) VALUES
// 	 ('019652de-0445-7e92-b3a8-69cdd552b726'::uuid,'2025-04-20 18:03:23.973+07','2025-04-20 18:03:23.973+07','kenshiroToki','$argon2id$v=19$m=65536,t=3,p=4$HZtpL/MFtte1OkDD5XmRUA$51WA2EK6Rd2koqTrqdEZtlaWctbav2b19uqufAh2PBo','45375-732753'),
// 	 ('019652de-a599-718c-850d-10797724a8c9'::uuid,'2025-04-20 18:04:05.273+07','2025-04-20 18:04:05.273+07','kenshiroToki2','$argon2id$v=19$m=65536,t=3,p=4$lWVG1S9fdDb2992U7/hh2A$XQtsowP49Dikj8P7FelXEPVLvwENwZ4lZGVRzpS4r+A','45375-732753'),
// 	 ('019652de-e08a-7fd6-8ed6-01e5d292ab1b'::uuid,'2025-04-20 18:04:20.362+07','2025-04-20 18:04:20.362+07','kenshiroToki3','$argon2id$v=19$m=65536,t=3,p=4$47qLAGAeQkOrlxiiVTJSlA$wptb8G4zm0xy//rq4PjSCkERQ9Bv5Wy0c6aWeRkPIGs','000000-000000');

import { Currency } from "./currency.entity.js";
import { initORM } from "./database.js";
import { Reward } from "./reward.entity.js";
import { User } from "./user.entity.js";
import { Wallet } from "./wallet.entity.js";
import argon2 from "argon2";

export async function seedDatabase() {
  const db = await initORM();
  const em = db.em.fork();
  // create currencies
  const currencies = [
    {
      name: "org1cur1",
      organizationId: "org1",
    },
    {
      name: "org1cur2",
      organizationId: "org1",
    },
    {
      name: "org2cur1",
      organizationId: "org2",
    },
  ];
  let managedCurrencies: Currency[] = [];
  for (const currency of currencies) {
    managedCurrencies.push(em.create(Currency, currency));
  }
  // create users
  const users: {
    username: string;
    password: string;
    organizationId: string;
  }[] = [
    {
      username: "administrator",
      password: "temppassword0",
      organizationId: "org1",
    },
    {
      username: "normaluser1",
      password: "temppassword1",
      organizationId: "org1",
    },
    {
      username: "normaluser2",
      password: "temppassword2",
      organizationId: "org1",
    },
    {
      username: "normaluser3",
      password: "temppassword3",
      organizationId: "org1",
    },
    {
      username: "administrator",
      password: "temppassword0",
      organizationId: "org2",
    },
    {
      username: "diffuser1",
      password: "temppassword1",
      organizationId: "org2",
    },
  ];
  let managedUsers: User[] = [];
  for (const user of users) {
    managedUsers.push(em.create(User, { ...user, password: await argon2.hash(user.password) }));
  }
  // create wallet for each users
  let managedWallets: Wallet[] = [];
  for (const user of managedUsers) {
    if (user.organizationId.endsWith("1")) {
      managedWallets.push(
        em.create(Wallet, {
          owner: user.uuid,
          amount: user.username === "administrator" ? 2000 : 970,
          currency: managedCurrencies[0].uuid,
        })
      );
      managedWallets.push(
        em.create(Wallet, {
          owner: user.uuid,
          amount: user.username === "administrator" ? 2000 : 970,
          currency: managedCurrencies[1].uuid,
        })
      );
    } else {
      managedWallets.push(
        em.create(Wallet, {
          owner: user.uuid,
          amount: user.username === "administrator" ? 2000 : 970,
          currency: managedCurrencies[2].uuid,
        })
      );
    }
  }
  // create rewards
  const rewards = [
    {
      name: "reward1_cur1_org1",
      description: "luxury",
      organizationId: "org1",
      price: 1500,
      currency: managedCurrencies[0].uuid,
    },
    {
      name: "reward2_cur1_org1",
      description: "not luxury",
      organizationId: "org1",
      price: 800,
      currency: managedCurrencies[0].uuid,
    },
    {
      name: "reward3_cur1_org1",
      description: "cheap",
      organizationId: "org1",
      price: 150,
      currency: managedCurrencies[0].uuid,
    },
    {
      name: "reward1_cur2_org1",
      description: "moderate",
      organizationId: "org1",
      price: 800,
      currency: managedCurrencies[1].uuid,
    },
    {
      name: "reward2_cur2_org1",
      description: "moderate",
      organizationId: "org1",
      price: 500,
      currency: managedCurrencies[1].uuid,
    },
    {
      name: "reward1_cur1_org2",
      description: "cheap",
      organizationId: "org2",
      price: 1500,
      currency: managedCurrencies[2].uuid,
    },
  ];
  const managedRewards: Reward[] = [];
  for (const reward of rewards) {
    managedRewards.push(em.create(Reward, reward));
  }
  // flush
  await em.flush();
  return { managedCurrencies, managedUsers, managedWallets, managedRewards };
}
