import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessageAttachments1789900000000 implements MigrationInterface {
    name = 'AddMessageAttachments1789900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message" ADD "attachment_type" character varying`);
        await queryRunner.query(`ALTER TABLE "message" ADD "attachment_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "attachment_url"`);
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "attachment_type"`);
    }

}