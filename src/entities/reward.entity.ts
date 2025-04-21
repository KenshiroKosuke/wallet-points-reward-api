import { Entity, ManyToOne, Property, Unique } from "@mikro-orm/core";
import { CustomBaseEntity } from "./base.entity.js";
import { Currency } from "./currency.entity.js";

@Entity()
export class Reward extends CustomBaseEntity {
  @Property({ type: "string" })
  name!: string;
  @ManyToOne(() => Currency)
  currency!: Currency;
  @Property({ type: "int" })
  price!: number;
  @Property({ type: "text" })
  description!: string;
  @Property({ type: "string" })
  organizationId!: string;
}
