import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

import { UserOrmEntity } from './apps/api/src/users/infrastructure/entities/user.orm-entity';
import { BrandOrmEntity } from './apps/api/src/brands/infrastructure/entities/brand.orm-entity';
import { ModelOrmEntity } from './apps/api/src/models/infrastructure/entities/model.orm-entity';
import { VehicleOrmEntity } from './apps/api/src/vehicles/infrastructure/entities/vehicle.orm-entity';

const randomLetters = (length: number) => Array.from({ length }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
const randomNumbers = (length: number) => Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
const generatePlate = () => `${randomLetters(3)}-${randomNumbers(1)}${randomLetters(1)}${randomNumbers(2)}`;
const generateChassis = () => crypto.randomBytes(8).toString('hex').toUpperCase() + randomLetters(1); 
const generateRenavam = () => randomNumbers(11);
const generateYear = () => Math.floor(Math.random() * (2024 - 2000 + 1)) + 2000;

const carData = {
  'Toyota': ['Corolla', 'Camry', 'Hilux', 'Yaris', 'RAV4', 'SW4', 'Prius', 'Etios', 'Corolla Cross', 'Land Cruiser'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V', 'Fit', 'City', 'WR-V', 'Pilot', 'Odyssey', 'Ridgeline'],
  'Volkswagen': ['Golf', 'Polo', 'Jetta', 'Passat', 'Tiguan', 'Nivus', 'T-Cross', 'Amarok', 'Saveiro', 'Virtus'],
  'Ford': ['Mustang', 'F-150', 'Ranger', 'EcoSport', 'Focus', 'Fiesta', 'Edge', 'Escape', 'Explorer', 'Bronco'],
  'Chevrolet': ['Camaro', 'Onix', 'Cruze', 'Tracker', 'S10', 'Equinox', 'Trailblazer', 'Spin', 'Montana', 'Silverado'],
  'BMW': ['Serie 3', 'Serie 5', 'Serie 7', 'X1', 'X3', 'X5', 'X6', 'M3', 'M4', 'Z4']
};

async function runSeed() {
  console.log('🚀 Iniciando script de seed super performático...\n');

  const dataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST || 'localhost',
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
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = new UserOrmEntity();
      user.id = crypto.randomUUID();
      user.nickname = 'aivacol';
      user.name = 'Aiva Col';
      user.email = 'aivacol@example.com';
      user.password = hashedPassword;
      user.created_by = 'system';
      
      // Upsert para não dar erro se já existir
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

      // 2. Criar 6 Marcas e seus Modelos
      console.log('2️⃣ Criando Marcas e Modelos...');
      const modelsList: ModelOrmEntity[] = [];

      for (const [brandName, models] of Object.entries(carData)) {
        let brand = await queryRunner.manager.findOne(BrandOrmEntity, { where: { name: brandName } });
        
        if (!brand) {
          brand = new BrandOrmEntity();
          brand.id = crypto.randomUUID();
          brand.name = brandName;
          brand.created_by = userId;
          await queryRunner.manager.insert(BrandOrmEntity, brand);
        }

        for (const modelName of models) {
          let model = await queryRunner.manager.findOne(ModelOrmEntity, { where: { name: modelName, brand_id: brand.id } });
          
          if (!model) {
            model = new ModelOrmEntity();
            model.id = crypto.randomUUID();
            model.name = modelName;
            model.brand_id = brand.id;
            model.created_by = userId;
            await queryRunner.manager.insert(ModelOrmEntity, model);
          }
          modelsList.push(model);
        }
      }
      console.log(`✅ 6 Marcas e ${modelsList.length} modelos garantidos no banco.`);

      // 3. Criar 1000 Veículos
      console.log('3️⃣ Criando 1000 veículos em lote...');
      const vehiclesToInsert: VehicleOrmEntity[] = [];
      const totalVehicles = 1000;

      for (let i = 0; i < totalVehicles; i++) {
        const randomModel = modelsList[Math.floor(Math.random() * modelsList.length)];
        
        const vehicle = new VehicleOrmEntity();
        vehicle.id = crypto.randomUUID();
        vehicle.license_plate = generatePlate();
        vehicle.chassis = generateChassis();
        vehicle.renavam = generateRenavam();
        vehicle.year = generateYear();
        vehicle.model_id = randomModel.id;
        vehicle.created_by = userId;

        vehiclesToInsert.push(vehicle);
      }

      // Inserir em chunks para não estourar os limites do banco (ex: 200 por vez)
      const chunkSize = 200;
      for (let i = 0; i < vehiclesToInsert.length; i += chunkSize) {
        const chunk = vehiclesToInsert.slice(i, i + chunkSize);
        await queryRunner.manager.insert(VehicleOrmEntity, chunk);
        console.log(`⏳ Inseridos ${Math.min(i + chunkSize, totalVehicles)} de ${totalVehicles} veículos...`);
      }

      console.log('✅ Todos os veículos inseridos com sucesso!');

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