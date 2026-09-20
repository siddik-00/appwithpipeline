import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789621610625 implements MigrationInterface {
    name = 'InitialSchema1789621610625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying(255) NOT NULL, "password_hash" character varying(512) NOT NULL, "first_name" character varying NOT NULL DEFAULT '', "last_name" character varying NOT NULL DEFAULT '', "email" character varying NOT NULL DEFAULT '', "phone" character varying NOT NULL DEFAULT '', "profession" character varying NOT NULL DEFAULT '', "address" character varying NOT NULL DEFAULT '', "country" character varying NOT NULL DEFAULT '', "website" character varying NOT NULL DEFAULT '', "name" character varying NOT NULL DEFAULT '', "bio" character varying NOT NULL DEFAULT '', "avatar_color" character varying NOT NULL DEFAULT '#6366f1', "avatar_url" character varying NOT NULL DEFAULT '', "verified" boolean NOT NULL DEFAULT false, "online" boolean NOT NULL DEFAULT false, "message_cost" real NOT NULL DEFAULT '2', "balance" real NOT NULL DEFAULT '0', "total_spent" real NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user" ("username") `);
        await queryRunner.query(`CREATE TABLE "post" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "parent_id" integer, "content" text NOT NULL, "gradient" character varying NOT NULL DEFAULT 'linear-gradient(135deg,#8364E8,#D397FA)', "image" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_52378a74ae3724bcab44036645" ON "post" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_502b5d7b881d2474c56195acb8" ON "post" ("parent_id") `);
        await queryRunner.query(`CREATE TABLE "like" ("id" SERIAL NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "reaction" character varying NOT NULL DEFAULT 'like', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eff3e46d24d416b52a7e0ae4159" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d41caa70371e578e2a4791a88a" ON "like" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4356ac2f9519c7404a2869f169" ON "like" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3221edd468ef18cc93a806b74b" ON "like" ("post_id", "user_id") `);
        await queryRunner.query(`CREATE TABLE "comment" ("id" SERIAL NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8aa21186314ce53c5b61a0e8c9" ON "comment" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bbfe153fa60aa06483ed35ff4a" ON "comment" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_be3ddcb8b8d19d94aa029ebab4" ON "comment" ("post_id", "user_id") `);
        await queryRunner.query(`CREATE TABLE "follow" ("id" SERIAL NOT NULL, "follower_id" integer NOT NULL, "following_id" integer NOT NULL, CONSTRAINT "PK_fda88bc28a84d2d6d06e19df6e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e65ef3268d3d5589f94b09c237" ON "follow" ("follower_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e66760f06ef2ca5eb43109d1c" ON "follow" ("following_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f3ea4388bcbbe0b554dd85c844" ON "follow" ("follower_id", "following_id") `);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "actor_id" integer, "type" character varying(50) NOT NULL, "message" text NOT NULL, "read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_928b7aa1754e08e1ed7052cb9d" ON "notification" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_16addcdc44128a517daeddd449" ON "notification" ("actor_id") `);
        await queryRunner.query(`CREATE TABLE "story" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "content" text NOT NULL, "gradient" character varying NOT NULL DEFAULT 'linear-gradient(135deg,#6200EE,#D397FA)', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_28fce6873d61e2cace70a0f3361" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cac14a7871997a849f8fc2dd20" ON "story" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "storyview" ("id" SERIAL NOT NULL, "story_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac8a949794f273491d1f5f0ed11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_69ab8a8701a7163ec59d6372b1" ON "storyview" ("story_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2e5bffdc88ad870fbeeae744f3" ON "storyview" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_de0abbd746efeffaaff50632c9" ON "storyview" ("story_id", "user_id") `);
        await queryRunner.query(`CREATE TABLE "friend_request" ("id" SERIAL NOT NULL, "from_id" integer NOT NULL, "to_id" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4c9d23ff394888750cf66cac17c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_709227be53cf49858d025ffeca" ON "friend_request" ("from_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_80b46cc7fff22b5d59105be8a8" ON "friend_request" ("to_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1561bd5ef74dbe2a89afdce078" ON "friend_request" ("from_id", "to_id") `);
        await queryRunner.query(`CREATE TABLE "bookmark" ("id" SERIAL NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b7fbf4a865ba38a590bb9239814" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_88d15be9a11888c73c7328a32f" ON "bookmark" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8f1a143c6ba8bba0e2a4f41e0d" ON "bookmark" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9835db6ee07225b1b2fad9943e" ON "bookmark" ("post_id", "user_id") `);
        await queryRunner.query(`CREATE TABLE "message" ("id" SERIAL NOT NULL, "sender_id" integer NOT NULL, "receiver_id" integer NOT NULL, "content" text NOT NULL, "read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c0ab99d9dfc61172871277b52f" ON "message" ("sender_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4da40532b0102d51beb220f16" ON "message" ("receiver_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c0914820dd41dddeca79e9a1cd" ON "message" ("sender_id", "receiver_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c0914820dd41dddeca79e9a1cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4da40532b0102d51beb220f16"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0ab99d9dfc61172871277b52f"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9835db6ee07225b1b2fad9943e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8f1a143c6ba8bba0e2a4f41e0d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88d15be9a11888c73c7328a32f"`);
        await queryRunner.query(`DROP TABLE "bookmark"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1561bd5ef74dbe2a89afdce078"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_80b46cc7fff22b5d59105be8a8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_709227be53cf49858d025ffeca"`);
        await queryRunner.query(`DROP TABLE "friend_request"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de0abbd746efeffaaff50632c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2e5bffdc88ad870fbeeae744f3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_69ab8a8701a7163ec59d6372b1"`);
        await queryRunner.query(`DROP TABLE "storyview"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cac14a7871997a849f8fc2dd20"`);
        await queryRunner.query(`DROP TABLE "story"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_16addcdc44128a517daeddd449"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_928b7aa1754e08e1ed7052cb9d"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3ea4388bcbbe0b554dd85c844"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e66760f06ef2ca5eb43109d1c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e65ef3268d3d5589f94b09c237"`);
        await queryRunner.query(`DROP TABLE "follow"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_be3ddcb8b8d19d94aa029ebab4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbfe153fa60aa06483ed35ff4a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8aa21186314ce53c5b61a0e8c9"`);
        await queryRunner.query(`DROP TABLE "comment"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3221edd468ef18cc93a806b74b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4356ac2f9519c7404a2869f169"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d41caa70371e578e2a4791a88a"`);
        await queryRunner.query(`DROP TABLE "like"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_502b5d7b881d2474c56195acb8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52378a74ae3724bcab44036645"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78a916df40e02a9deb1c4b75ed"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
