import { Entity, Property, Unique } from "@mikro-orm/core";
import { CustomBaseEntity } from "./base.entity.js";

@Entity()
export class Currency extends CustomBaseEntity {
  @Property({ type: "string" })
  name!: string;
  @Property({ type: "string" }) //maybe included to trade query time for space
  organizationId!: string;
}