import { Entity, Opt, Property, Unique } from "@mikro-orm/core";
import { CustomBaseEntity } from "./base.entity.js";

@Entity()
@Unique({ properties: ["username", "organizationId"] })
export class User extends CustomBaseEntity {
  @Property({ type: "string" })
  username!: string;
  @Property({ type: "string" })
  password!: string;
  @Property({ type: "string" })
  organizationId!: string; // substitued for ObjectId
}
