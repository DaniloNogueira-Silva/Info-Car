import { MigrationInterface, QueryRunner } from "typeorm";

export class RentalFeature1780853631226 implements MigrationInterface {
    name = 'RentalFeature1780853631226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customers" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_133ec679a801fab5e070f73d3ea" DEFAULT NEWSEQUENTIALID(), "name" nvarchar(150) NOT NULL, "email" nvarchar(150) NOT NULL, "cnh" nvarchar(20) NOT NULL, "created_at" datetime2 NOT NULL CONSTRAINT "DF_a8fcf679692db1c886e7f15d2ba" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_386a5e03676dab6b7bf4bf020bd" DEFAULT getdate(), CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email"), CONSTRAINT "UQ_5329dc7dc26e74ccb3b0cf54051" UNIQUE ("cnh"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rentals" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_2b10d04c95a8bfe85b506ba52ba" DEFAULT NEWSEQUENTIALID(), "vehicle_id" uniqueidentifier NOT NULL, "customer_id" uniqueidentifier NOT NULL, "start_date" datetime2 NOT NULL, "end_date" datetime2, "status" nvarchar(50) NOT NULL CONSTRAINT "DF_20715131f8422cee556fa9c76b4" DEFAULT 'ACTIVE', "created_at" datetime2 NOT NULL CONSTRAINT "DF_2faa6a7d305e9a58f075aac2872" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_333bd30d00991cca034e0911e0e" DEFAULT getdate(), CONSTRAINT "PK_2b10d04c95a8bfe85b506ba52ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fines" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_b706344bc8943ab7a88ed5d312e" DEFAULT NEWSEQUENTIALID(), "rental_id" uniqueidentifier NOT NULL, "amount" decimal(10,2) NOT NULL, "points" int NOT NULL, "description" nvarchar(255) NOT NULL, "created_at" datetime2 NOT NULL CONSTRAINT "DF_87afa6085eaaef7086369f62c28" DEFAULT getdate(), CONSTRAINT "PK_b706344bc8943ab7a88ed5d312e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "status" nvarchar(50) NOT NULL CONSTRAINT "DF_198957f5c5a1fa53aeaf2a08386" DEFAULT 'AVAILABLE'`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "created_by" nvarchar(100)`);
        await queryRunner.query(`ALTER TABLE "rentals" ADD CONSTRAINT "FK_846b287c1617bf1a2f74107f8e9" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rentals" ADD CONSTRAINT "FK_2e144b6f536b4fbad3c01bee620" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fines" ADD CONSTRAINT "FK_4421aa352109428d4b6ff4622ae" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fines" DROP CONSTRAINT "FK_4421aa352109428d4b6ff4622ae"`);
        await queryRunner.query(`ALTER TABLE "rentals" DROP CONSTRAINT "FK_2e144b6f536b4fbad3c01bee620"`);
        await queryRunner.query(`ALTER TABLE "rentals" DROP CONSTRAINT "FK_846b287c1617bf1a2f74107f8e9"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "created_by" nvarchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "DF_198957f5c5a1fa53aeaf2a08386"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TABLE "fines"`);
        await queryRunner.query(`DROP TABLE "rentals"`);
        await queryRunner.query(`DROP TABLE "customers"`);
    }

}
