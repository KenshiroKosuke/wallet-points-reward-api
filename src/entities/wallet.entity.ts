import { Entity, ManyToOne, Property, Unique } from "@mikro-orm/core";
import { CustomBaseEntity } from "./base.entity.js";
import { Currency } from "./currency.entity.js";
import { User } from "./user.entity.js";

@Entity()
export class Wallet extends CustomBaseEntity {
  // @Property({ type: "uuid" })
  // owner!: string;
  @ManyToOne(() => User)
  owner!: User; // this will be owner_uuid in the table
  @ManyToOne(() => Currency)
  currency!: Currency; // this will be currency_uuid in the table
  @Property({ type: "int" })
  amount!: number;
  // @Property({ type: "string" }) //maybe included to trade query time for space
  // organizationId!: string;
}