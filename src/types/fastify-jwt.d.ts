// fastify-jwt.d.ts
import "@fastify/jwt"

declare module "@fastify/jwt" {
  interface FastifyJWT {
    // payload: { username: string, organizationId: string } // payload type is used for signing and verifying
    user: {
      username: string, organizationId: string, uuid: string
    } // user type is return type of `request.user` object
  }
}