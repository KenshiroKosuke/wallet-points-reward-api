import { Collection, Entity, ManyToOne, OneToMany } from "@mikro-orm/core";
import { CustomBaseEntity } from "./base.entity.js";
import { User } from "./user.entity.js";
import { PointRewardLog } from "./pointRewardLog.js";

// transaction log: can consist of multiple rewards
@Entity()
export class PointLog extends CustomBaseEntity {
  // (log type: maybe in the future)
  @ManyToOne(() => User)
  sender!: User;
  @ManyToOne(() => User)
  target!: User;
  @OneToMany(() => PointRewardLog, (pointRewardLog) => pointRewardLog.pointLog)
  rewardLogs = new Collection<PointRewardLog>(this); // virtual property to populate
  // e.g. em.findOne(Author, '...', { populate: ['books'] });
}
