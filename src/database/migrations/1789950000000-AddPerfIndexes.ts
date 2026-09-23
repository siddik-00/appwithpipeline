import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerfIndexes1789950000000 implements MigrationInterface {
    name = 'AddPerfIndexes1789950000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_story_created_at" ON "story" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_notification_user_read" ON "notification" ("user_id", "read") `);
        await queryRunner.query(`CREATE INDEX "IDX_notification_created_at" ON "notification" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_message_receiver_read" ON "message" ("receiver_id", "read") `);
        await queryRunner.query(`CREATE INDEX "IDX_message_created_at" ON "message" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_comment_created_at" ON "comment" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_bookmark_created_at" ON "bookmark" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_friend_request_from_status" ON "friend_request" ("from_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_friend_request_to_status" ON "friend_request" ("to_id", "status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_friend_request_to_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_friend_request_from_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bookmark_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_message_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_message_receiver_read"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notification_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notification_user_read"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_story_created_at"`);
    }

}