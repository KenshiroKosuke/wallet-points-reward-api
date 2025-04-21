import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginCallback } from "fastify";
import { appConfigs } from "src/configs/app.config.js";
import { getORM } from "src/entities/database.js";
import argon2 from 'argon2'

const UserSignUpDto = Type.Object({
  username: Type.String({
    pattern: "^[a-zA-Z0-9_]+$",
    minLength: 8,
  }),
  password: Type.String({
    minLength: 5,
  }),
  organizationId: Type.String(),
});
type TUserSignUpDto = Static<typeof UserSignUpDto>;

export const authController: FastifyPluginCallback =async (fastify, opts) => {
  const db = await getORM()
  fastify.post<{
    Body: TUserSignUpDto;
  }>(
    "/signup",
    {
      schema: {
        body: UserSignUpDto,
      },
    },
    async (request, reply) => {
      try {
        const { username, password, organizationId } = request.body;
        // await authService.signUp({username,password,organizationId})
        if (await db.user.findOne({$and:[{organizationId: {$eq: organizationId}},{username: {$eq: username}}]})) {
          return reply.status(400).send({ success: false, msg: 'User already exists within organization.' });
          // throw new Error('User already exists within organization.');
        }
        const hashedPassword = await argon2.hash(password)
        const {password:_, ...user} = db.user.create({ username, password: hashedPassword, organizationId })
        await db.em.flush();
        return reply.status(201).send({ success: true, data: user });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({ success: false, msg: error});
      }
    }
  );
  fastify.post<{
    Body: TUserSignUpDto;
  }>(
    "/signin",
    {
      schema: {
        body: UserSignUpDto,
      },
    },
    async (request, reply) => {
      try {
        const { username, password, organizationId } = request.body;
        
        const dbUser = await db.user.findOne({$and:[{organizationId: {$eq: organizationId}},{username: {$eq: username}}]});
        if(!dbUser){
          return reply.status(401).send({ success: false, msg: "invalid credential" })
        }
        const match = await argon2.verify(dbUser.password, password)
        if(!match){
          return reply.status(401).send({ success: false, msg: "invalid credential" })
        }
        const token = fastify.jwt.sign({ username, organizationId, uuid: dbUser.uuid });
        return reply.setCookie("serverToken",token,{httpOnly: true, sameSite: "strict", secure: appConfigs.node.nodeEnv === "production", path: "/" }).send({ success: true });
        // await authService.signIn({username,password,organizationId})
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({ success: false, msg: error });
      }
    }
  );
  fastify.post("/signout", async (request, reply) => {
    reply.clearCookie("serverToken").send({success:true})
  });
  fastify.get("/profile",{
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const wallets = await db.wallet.find({owner: request.user.uuid},{populate: ["currency"]})
    return {
      user: request.user,
      wallets
    };
  });
  // done();
};
