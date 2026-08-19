import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordToUsers1787130000000
  implements MigrationInterface
{
  name = 'AddPasswordToUsers1787130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "password" character varying(255) NOT NULL DEFAULT ''
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "password" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "password"
    `);
  }
}