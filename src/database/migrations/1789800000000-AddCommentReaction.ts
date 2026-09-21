import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommentReaction1789800000000 implements MigrationInterface {
    name = 'AddCommentReaction1789800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "comment_reaction" ("id" SERIAL NOT NULL, "comment_id" integer NOT NULL, "user_id" integer NOT NULL, "reaction" character varying NOT NULL DEFAULT 'like', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9f6b3e2d41b5f0c8a7d9b3c40a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_comment_reaction_comment" ON "comment_reaction" ("comment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comment_reaction_user" ON "comment_reaction" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comment_reaction_pair" ON "comment_reaction" ("comment_id", "user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_reaction_pair"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_reaction_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_reaction_comment"`);
        await queryRunner.query(`DROP TABLE "comment_reaction"`);
    }

}