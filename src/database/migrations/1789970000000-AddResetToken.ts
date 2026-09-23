import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResetToken1789970000000 implements MigrationInterface {
    name = 'AddResetToken1789970000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "reset_token" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "reset_token_expires" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "reset_token_expires"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "reset_token"`);
    }

}