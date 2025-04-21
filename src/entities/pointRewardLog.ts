import { Entity, ManyToOne, Rel } from "@mikro-orm/core";
import { CustomBaseEntity } from "./base.entity.js";
import { Reward } from "./reward.entity.js";
import { PointLog } from "./pointLog.entity.js";

@Entity()
export class PointRewardLog extends CustomBaseEntity {
  @ManyToOne(() => Reward)
  reward!: Reward; // reward being exchanged
  @ManyToOne("PointLog")
  pointLog!: Rel<PointLog>; // which exchange this comes from. Using ref to mitigate circular dependency in js
  // // if a reward can be exchanged with multiple currencies
  // @ManyToOne(() => Currency)
  // currency!: Currency;
  // @Property({ type: "int" })
  // amount!: number;
}
