import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

import { UserOrmEntity } from './apps/api/src/users/infrastructure/entities/user.orm-entity';
import { BrandOrmEntity } from './apps/api/src/brands/infrastructure/entities/brand.orm-entity';
import { ModelOrmEntity } from './apps/api/src/models/infrastructure/entities/model.orm-entity';
import { VehicleOrmEntity } from './apps/api/src/vehicles/infrastructure/entities/vehicle.orm-entity';

async function runSeed() {
  console.log('🚀 Iniciando script de seed...\n');

  const dataSource = new DataSource({
    type: 'mssql',
    host: 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '1433', 10),
    username: process.env.DB_USERNAME || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrong!Passw0rd',
    database: process.env.DB_DATABASE || 'info-car',
    entities: [UserOrmEntity, BrandOrmEntity, ModelOrmEntity, VehicleOrmEntity],
    synchronize: false,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados com sucesso!');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Criar o Usuário Default (aivacol)
      console.log('1️⃣ Criando Usuário Default (aivacol)...');
      
      const hashedPassword = await bcrypt.hash('aivacol', 10);
      const user = new UserOrmEntity();
      user.id = crypto.randomUUID();
      user.nickname = 'aivacol';
      user.name = 'Aiva Col';
      user.email = 'aivacol@aivacol.com';
      user.password = hashedPassword;
      user.created_by = 'system';
      
      const existingUser = await queryRunner.manager.findOne(UserOrmEntity, { where: { email: user.email } });
      let userId: string;
      if (!existingUser) {
        await queryRunner.manager.insert(UserOrmEntity, user);
        userId = user.id;
        console.log(`✅ Usuário criado com ID: ${userId}`);
      } else {
        userId = existingUser.id;
        console.log(`✅ Usuário já existia com ID: ${userId}`);
      }

      // 2. Ler mock de veículos
      const mockPath = path.join(__dirname, 'seed_vehicles.json');
      const mockData = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
      
      console.log('2️⃣ Lendo mock de veículos e criando marcas/modelos necessários...');
      
      const brandsCache = new Map<string, string>();
      const modelsCache = new Map<string, string>();

      const vehiclesToInsert: VehicleOrmEntity[] = [];

      for (const item of mockData) {
        // Garantir Marca
        let brandId = brandsCache.get(item.brand);
        if (!brandId) {
          let brand = await queryRunner.manager.findOne(BrandOrmEntity, { where: { name: item.brand } });
          if (!brand) {
            brand = new BrandOrmEntity();
            brand.id = crypto.randomUUID();
            brand.name = item.brand;
            brand.created_by = userId;
            await queryRunner.manager.insert(BrandOrmEntity, brand);
          }
          brandId = brand.id;
          brandsCache.set(item.brand, brandId);
        }

        // Garantir Modelo
        const modelCacheKey = `${item.brand}_${item.model}`;
        let modelId = modelsCache.get(modelCacheKey);
        if (!modelId) {
          let model = await queryRunner.manager.findOne(ModelOrmEntity, { where: { name: item.model, brand_id: brandId } });
          if (!model) {
            model = new ModelOrmEntity();
            model.id = crypto.randomUUID();
            model.name = item.model;
            model.brand_id = brandId;
            model.created_by = userId;
            await queryRunner.manager.insert(ModelOrmEntity, model);
          }
          modelId = model.id;
          modelsCache.set(modelCacheKey, modelId);
        }

        // Criar Veículo
        const vehicle = new VehicleOrmEntity();
        vehicle.id = crypto.randomUUID();
        vehicle.license_plate = item.license_plate;
        vehicle.chassis = item.chassis;
        vehicle.renavam = item.renavam;
        vehicle.year = item.year;
        vehicle.model_id = modelId;
        vehicle.created_by = userId;

        vehiclesToInsert.push(vehicle);
      }

      console.log('3️⃣ Inserindo veículos no banco de dados...');
      const chunkSize = 50;
      for (let i = 0; i < vehiclesToInsert.length; i += chunkSize) {
        const chunk = vehiclesToInsert.slice(i, i + chunkSize);
        await queryRunner.manager.insert(VehicleOrmEntity, chunk);
      }

      console.log(`✅ ${vehiclesToInsert.length} veículos inseridos com sucesso!`);

      await queryRunner.commitTransaction();
      console.log('✅ Transação concluída (Commit)!');
    } catch (err) {
      console.error('❌ Erro durante a inserção, fazendo rollback...', err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('\n❌ Falha na conexão ou execução do DataSource:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Conexão fechada.');
    }
  }
}

runSeed();