import { MigrationInterface, QueryRunner } from "typeorm";

export class TemporaryPassword1609088089333 implements MigrationInterface {
    name = "TemporaryPassword1609088089333"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE \"athlete\" ADD COLUMN \"tmpPassword\" character varying(100)", undefined);
        await queryRunner.query("ALTER TABLE \"coach\" ADD COLUMN \"tmpPassword\" character varying(100)", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE \"athlete\" DROP COLUMN \"tmpPassword\"", undefined);
        await queryRunner.query("ALTER TABLE \"coach\" DROP COLUMN \"tmpPassword\"", undefined);
    }

}
