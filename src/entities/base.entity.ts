import { Opt, PrimaryKey, Property } from "@mikro-orm/core";
import { uuidv7 } from "uuidv7";

// Do not use @Entity() for abstract base classes.
export abstract class CustomBaseEntity {
  @PrimaryKey({ type: "uuid" })
  uuid = uuidv7(); // string implied

  @Property()
  createdAt: Date & Opt = new Date(); // Opt is used for optional input type, otherwise the default values will be assigned.

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date & Opt = new Date();
}