import "reflect-metadata"
import { fastify, FastifyReply, FastifyRequest, FastifyServerOptions } from 'fastify'
import { fastifyCors } from "@fastify/cors";
import { authController } from '#/controllers/auth.controller.js'
import { appConfigs } from './configs/app.config.js';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { RequestContext } from '@mikro-orm/core';
import { initORM } from './entities/database.js';
import { createReadStream } from "node:fs";
import path from "node:path";
import { DIR_NAME } from "./utils/helper.js";
import { pointController } from "./controllers/point.controller.js";
import { seedDatabase } from "./entities/seed.js";

export async function buildApp(opts:FastifyServerOptions={}) {
  // https://fastify.dev/docs/latest/Reference/Server/
  const app = fastify(opts)
  app.register(fastifyCookie);
  app.register(fastifyJwt, {
    secret: appConfigs.auth.jwtSecret,
    cookie: {
      cookieName: "serverToken",
      signed: false
    }
  })
  app.register(fastifyCors,appConfigs.server.corsOptions);
  const db = await initORM()
  app.addHook("onRequest", (request, reply, done) => {
    RequestContext.create(db.em, done);
  });
  app.addHook("onClose", async () => {
    await db.orm.close();
  });
  app.decorate("authenticate", async function(request:FastifyRequest, reply:FastifyReply) {
    try {
      await request.jwtVerify()
      request.log.debug(request.user)
    } catch (err) {
      reply.send(err)
    }
  })
  app.register(authController,{prefix: "/auth"})
  app.register(pointController,{prefix: "/point"})
  app.get('/seedDatabase', async function (request, reply) {
    const data = await seedDatabase()
    return { success: true, data}
  })
  app.get('/refreshDatabase', async function (request, reply) {
    await db.orm.schema.clearDatabase()
    return { success: true}
  })
  app.get('/updateDatabase', async function (request, reply) {
    await db.orm.schema.updateSchema();
    return { success: true}
  })
  app.get('/dropDatabase', async function (request, reply) {
    await db.orm.schema.dropSchema()
    return { success: true}
  })
  app.get('/resetPoints', async function (request, reply) {
    await db.wallet.nativeUpdate({},{amount: 2000})
    return { success: true}
  })
  // app.get('/er', async function (request, reply) {
  //   const stream = createReadStream(path.join(DIR_NAME,"entities","ER.html"))
  //   return reply.type('text/html').send(stream)
  // })
  app.get('/', async function (request, reply) {
    return { hello: 'world' }
  })
  return app
}