import { FilterQuery } from "@mikro-orm/core";
import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginCallback } from "fastify";
import { appConfigs } from "src/configs/app.config.js";
import { Currency } from "src/entities/currency.entity.js";
import { getORM } from "src/entities/database.js";
import { PointLog } from "src/entities/pointLog.entity.js";
import { Reward } from "src/entities/reward.entity.js";
import { Wallet } from "src/entities/wallet.entity.js";

const AddRewardDto = Type.Object({
  name: Type.String(),
  price: Type.Number(),
  currency: Type.String(),
  description: Type.String(),
});
type TAddRewardDto = Static<typeof AddRewardDto>;

const ExchangePointDto = Type.Object({
  target: Type.String(), // receiver's id
  rewards: Type.Array(Type.String()), // id[]
  isConfirmedAction: Type.Boolean(),
});
type TExchangePointDto = Static<typeof ExchangePointDto>;

const QueryRewardDto = Type.Object({
  name: Type.Optional(Type.String()),
  price: Type.Optional(Type.Number()),
  currency: Type.Optional(Type.String()),
  isPointEnough: Type.Optional(Type.Boolean()),
  page: Type.Number(),
  limit: Type.Number(),
});
type TQueryRewardDto = Static<typeof QueryRewardDto>;

const QueryLogDto = Type.Object({
  asAdmin: Type.Optional(Type.Boolean()),
  roleFilter: Type.Optional(Type.Array(Type.String())),
  page: Type.Number(),
  limit: Type.Number(),
});
type TQueryLogDto = Static<typeof QueryLogDto>;

export const pointController: FastifyPluginCallback = async (fastify, opts) => {
  const db = await getORM();
  fastify.post<{
    Body: TAddRewardDto;
  }>(
    "/rewards/add",
    {
      schema: {
        body: AddRewardDto,
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        if (request.user.username !== "administrator") {
          return reply.status(403).send({ success: false, msg: "Unauthorized" });
        }
        const { description, name, price, currency } = request.body;
        // cehck currency
        const isValidCurrency = await db.currency.findOne({
          organizationId: request.user.organizationId,
          uuid: currency
        })
        if(!isValidCurrency){
          return reply.status(400).send({
            msg: "Invalid Currency"
          })
        }
        const newReward = db.reward.create({
          description,
          name,
          price,
          organizationId: request.user.organizationId,
          currency: currency,
        });
        await db.em.flush();
        return reply.status(201).send({ success: true, data: newReward });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ success: false });
      }
    }
  );
  fastify.post<{ Body: TExchangePointDto }>(
    "/rewards/exchange",
    {
      schema: {
        body: ExchangePointDto,
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      // TODO: exchange for same item multiple times?
      const { rewards, target, isConfirmedAction } = request.body;
      const { organizationId, uuid } = request.user;
      // check target and user same org?
      const dbTarget = await db.user.findOne({
        organizationId: organizationId,
        uuid: target,
      });
      if (!dbTarget) {
        return reply.status(400).send({
          error: "Invalid Target",
        });
      }
      // check if able to exchange AND enough point(s)
      // 1. get all rewards planned to exchange
      const dbRewards: (Reward & Wallet & { currencyId: string; createdAt: string; rewardName: string })[] = await db.em
        .getKnex()("reward as r")
        .withSchema("point_exchange_dev_2")
        .whereIn("r.uuid", rewards) // rewards could be invalid array and dbRewards will be empty
        .join("wallet as w", "w.currency_uuid", "r.currency_uuid")
        .withSchema("point_exchange_dev_2")
        .andWhere("w.owner_uuid", uuid)
        .select([
          "r.uuid",
          "r.name as rewardName",
          "r.description",
          "r.created_at as createdAt",
          "r.price",
          "r.organization_id as organizationId",
          "r.currency_uuid as currencyId",
          // "c.name as currencyName",
          "w.amount",
        ]);
      request.log.debug({ dbRewards });
      // 2. check rewards array and orgid
      if (
        dbRewards.length !== rewards.length ||
        dbRewards.length === 0 ||
        dbRewards.some((r) => r.organizationId !== organizationId)
      ) {
        return reply.status(400).send({
          error: "Invalid Rewards",
        });
      }
      // 3. check price and wallet
      // map uuid => {sumPrice, amount in wallet}
      const totals = new Map<string, { sumPrice: number; amount: number }>();
      for (const { currencyId, amount, price } of dbRewards) {
        if (!totals.has(currencyId)) {
          totals.set(currencyId, { sumPrice: 0, amount });
        }
        const group = totals.get(currencyId)!;
        group.sumPrice += price;
      }
      for (const [currencyId, { sumPrice, amount }] of totals.entries()) {
        request.log.debug({ currencyId, sumPrice, amount });
        if (sumPrice > amount) {
          return reply.status(400).send({
            error: "Points Not Enough",
            currencyId: currencyId,
          });
        }
      }

      // check isConfirmedAction
      if (isConfirmedAction !== true) {
        return reply.status(200).send({ success: true, msg: "Point Exchange Possible" });
      }

      // ALL IS WELL => update wallet
      const currencies = Array.from(totals.keys());
      request.log.debug({ currencies });
      const wallets = await db.wallet.find({
        owner: uuid,
        currency: { $in: currencies.map((id) => db.em.getReference(Currency, id)) },
      });
      request.log.debug({ wallets });
      for (const wallet of wallets) {
        wallet.amount -= totals.get(wallet.currency.uuid)!.sumPrice;
      }

      // create pointLog and pointRewardLog(s)
      const pointLog = db.pointLog.create({ sender: uuid, target });
      for (const rewardId of rewards) {
        db.pointRewardLog.create({ pointLog: pointLog, reward: rewardId });
      }
      await db.em.flush();
      return reply.status(201).send({ success: true, wallets, rewards: dbRewards });
    }
  );
  fastify.get(
    "/rewards/all",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const rewards = await db.reward.find({
        $and: [
          {
            organizationId: { $eq: request.user.organizationId },
          },
        ],
      });
      if (!rewards) {
        throw new Error("Reward not found");
      }
      return {
        success: true,
        data: rewards,
      };
    }
  );
  fastify.get<{ Querystring: TQueryRewardDto }>(
    "/rewards",
    {
      schema: {
        querystring: QueryRewardDto,
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      console.log(request.query);
      const { isPointEnough, price, currency, limit, page } = request.query;
      let paginationPage = page;
      if (page < 1) {
        paginationPage = 1;
      }
      const paginationOffset = (paginationPage - 1) * limit;
      const qb = db.em.getKnex()("reward as r").withSchema("point_exchange_dev_2");
      qb.where("r.organization_id", request.user.organizationId);
      if (isPointEnough) {
        qb.join("wallet as w", "w.currency_uuid", "r.currency_uuid")
          .withSchema("point_exchange_dev_2")
          .where("w.owner_uuid", request.user.uuid)
          .andWhere("w.amount", ">=", db.em.getKnex().ref("r.price"));
      }
      if (currency) {
        qb.where("r.currency_uuid", currency);
      }

      // get total count
      const totalCountQuery = qb.clone().count();
      // get paginated rows
      // maybe not join currency to save time
      const dataQuery = qb
        .clone()
        .join("currency as c", "c.uuid", "r.currency_uuid")
        .withSchema("point_exchange_dev_2")
        .select([
          "r.uuid",
          "r.name as rewardName",
          "r.description",
          "r.created_at as createdAt",
          "r.price",
          "c.name as currencyName",
        ])
        .offset(paginationOffset)
        .limit(limit);

      const [totalCountResponse, rewards] = await Promise.all([totalCountQuery, dataQuery]);
      if (!rewards) {
        throw new Error("Reward not found");
      }
      return {
        success: true,
        data: rewards,
        count: totalCountResponse[0]["count"],
      };
    }
  );
  fastify.get<{ Querystring: TQueryLogDto }>(
    "/logs",
    {
      schema: {
        querystring: QueryLogDto,
      },
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { asAdmin, roleFilter, limit, page } = request.query;
      let paginationPage = page;
      if (page < 1) {
        paginationPage = 1;
      }
      const paginationOffset = (paginationPage - 1) * limit;
      request.log.debug(roleFilter);
      const { uuid } = request.user;
      let roleFilterQuery: FilterQuery<PointLog>[] = [];
      if (roleFilter && roleFilter.length > 0) {
        if (roleFilter.includes("sender")) {
          roleFilterQuery.push({ sender: uuid });
        }
        if (roleFilter.includes("target")) {
          roleFilterQuery.push({ target: uuid });
        }
      }
      if (roleFilterQuery.length === 0) {
        roleFilterQuery = [{ sender: uuid }, { target: uuid }];
      }
      request.log.debug(roleFilterQuery);
      const [data, count] = await db.pointLog.findAndCount(
        { $or: roleFilterQuery },
        { populate: ["rewardLogs", "rewardLogs.reward"], offset: paginationOffset, limit: limit }
      );
      return reply.status(200).send({ success: true, data, count });
    }
  );
  // done();
};
