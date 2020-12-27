import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1608999993225 implements MigrationInterface {
    name = "InitialMigration1608999993225"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE \"coach\" (\"id\" SERIAL NOT NULL, \"name\" character varying(80) NOT NULL, \"email\" character varying(100) NOT NULL, \"password\" character varying(60) NOT NULL, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"PK_c2ca0875fe0755b197d0147713d\" PRIMARY KEY (\"id\"))", undefined);
        await queryRunner.query("CREATE TABLE \"athlete\" (\"id\" SERIAL NOT NULL, \"name\" character varying(80) NOT NULL, \"email\" character varying(100) NOT NULL, \"password\" character varying(60) NOT NULL, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now(), \"coachId\" integer, \"availabilityId\" integer, CONSTRAINT \"REL_bc19ce85cf17fe62ed844643ce\" UNIQUE (\"availabilityId\"), CONSTRAINT \"PK_8bf51e0689529ca963f10949596\" PRIMARY KEY (\"id\"))", undefined);
        await queryRunner.query("CREATE TABLE \"availability\" (\"id\" SERIAL NOT NULL, \"monday\" boolean NOT NULL DEFAULT true, \"tuesday\" boolean NOT NULL DEFAULT true, \"wednesday\" boolean NOT NULL DEFAULT true, \"thursday\" boolean NOT NULL DEFAULT true, \"friday\" boolean NOT NULL DEFAULT true, \"saturday\" boolean NOT NULL DEFAULT true, \"sunday\" boolean NOT NULL DEFAULT true, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"PK_05a8158cf1112294b1c86e7f1d3\" PRIMARY KEY (\"id\"))", undefined);
        await queryRunner.query("CREATE TABLE \"notification\" (\"id\" SERIAL NOT NULL, \"status\" character varying NOT NULL, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now(), \"athleteId\" integer, \"coachId\" integer, CONSTRAINT \"PK_705b6c7cdf9b2c2ff7ac7872cb7\" PRIMARY KEY (\"id\"))", undefined);
        await queryRunner.query("CREATE TABLE \"discipline\" (\"id\" SERIAL NOT NULL, \"name\" character varying(20) NOT NULL, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"PK_139512aefbb11a5b2fa92696828\" PRIMARY KEY (\"id\"))", undefined);
        await queryRunner.query("CREATE TABLE \"activity\" (\"id\" SERIAL NOT NULL, \"description\" character varying(255) NOT NULL, \"date\" date NOT NULL, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now(), \"athleteId\" integer, \"disciplineId\" integer, CONSTRAINT \"PK_24625a1d6b1b089c8ae206fe467\" PRIMARY KEY (\"id\"))", undefined);
        await queryRunner.query("ALTER TABLE \"athlete\" ADD CONSTRAINT \"FK_bee4a14a720fe1c850b2a86b3a9\" FOREIGN KEY (\"coachId\") REFERENCES \"coach\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE \"athlete\" ADD CONSTRAINT \"FK_bc19ce85cf17fe62ed844643ce9\" FOREIGN KEY (\"availabilityId\") REFERENCES \"availability\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE \"notification\" ADD CONSTRAINT \"FK_f0844408c6efec3b8aa0e109904\" FOREIGN KEY (\"athleteId\") REFERENCES \"athlete\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE \"notification\" ADD CONSTRAINT \"FK_3f726516ad65333c989489cc899\" FOREIGN KEY (\"coachId\") REFERENCES \"coach\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE \"activity\" ADD CONSTRAINT \"FK_bbc62f864b2e35d162e0c5d2cc7\" FOREIGN KEY (\"athleteId\") REFERENCES \"athlete\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE \"activity\" ADD CONSTRAINT \"FK_d0dd8bb317e6137173484267b14\" FOREIGN KEY (\"disciplineId\") REFERENCES \"discipline\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE \"activity\" DROP CONSTRAINT \"FK_d0dd8bb317e6137173484267b14\"", undefined);
        await queryRunner.query("ALTER TABLE \"activity\" DROP CONSTRAINT \"FK_bbc62f864b2e35d162e0c5d2cc7\"", undefined);
        await queryRunner.query("ALTER TABLE \"notification\" DROP CONSTRAINT \"FK_3f726516ad65333c989489cc899\"", undefined);
        await queryRunner.query("ALTER TABLE \"notification\" DROP CONSTRAINT \"FK_f0844408c6efec3b8aa0e109904\"", undefined);
        await queryRunner.query("ALTER TABLE \"athlete\" DROP CONSTRAINT \"FK_bc19ce85cf17fe62ed844643ce9\"", undefined);
        await queryRunner.query("ALTER TABLE \"athlete\" DROP CONSTRAINT \"FK_bee4a14a720fe1c850b2a86b3a9\"", undefined);
        await queryRunner.query("DROP TABLE \"activity\"", undefined);
        await queryRunner.query("DROP TABLE \"discipline\"", undefined);
        await queryRunner.query("DROP TABLE \"notification\"", undefined);
        await queryRunner.query("DROP TABLE \"availability\"", undefined);
        await queryRunner.query("DROP TABLE \"athlete\"", undefined);
        await queryRunner.query("DROP TABLE \"coach\"", undefined);
    }

}
