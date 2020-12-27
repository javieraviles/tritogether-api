import { MigrationInterface, QueryRunner } from "typeorm";

export class PopulateDisciplines1609000302333 implements MigrationInterface {
    name = "PopulateDisciplines1609000302333"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("INSERT INTO discipline (id, name) VALUES (1, 'swimming'), (2, 'cycling'), (3, 'running'), (4, 'other')", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("TRUNCATE discipline CASCADE", undefined);
    }

}
