import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommentParent1789960000000 implements MigrationInterface {
    name = 'AddCommentParent1789960000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" ADD "parent_id" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_comment_parent_id" ON "comment" ("parent_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_parent_id"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP COLUMN "parent_id"`);
    }

}