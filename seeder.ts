const API_BASE_URL = 'http://localhost:3000/api/v1';

// --- FUNÇÕES AUXILIARES DE GERAÇÃO ---
const randomString = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
const randomLetters = (length) => Array.from({ length }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
const randomNumbers = (length) => Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

// Gera placa no formato Mercosul (ex: ABC-1D23) para dar match com o seu Swagger
const generatePlate = () => `${randomLetters(3)}-${randomNumbers(1)}${randomLetters(1)}${randomNumbers(2)}`;
const generateChassis = () => randomString(17); 
const generateRenavam = () => randomNumbers(11);
const generateYear = () => Math.floor(Math.random() * (2024 - 2000 + 1)) + 2000;

// --- FUNÇÃO PRINCIPAL ---
async function runSeed() {
  try {
    console.log('🚀 Iniciando script de seed...\n');

    // 0. Autenticação
    console.log('0️⃣ Criando e autenticando usuário...');
    const userPayload = {
      nickname: `seeder_${randomString(3)}`,
      name: 'Seeder User',
      email: `seeder_${randomString(5)}@example.com`,
      password: 'password123'
    };
    const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload)
    });
    const authData = await registerRes.json();
    if (!registerRes.ok) throw new Error(`Erro no Registro: ${JSON.stringify(authData)}`);
    const token = authData.access_token;
    console.log(`✅ Usuário criado e autenticado! Token: ${token.substring(0, 10)}...\n`);

    // 1. Criar Brand
    console.log('1️⃣ Criando Brand...');
    const brandPayload = { name: `Marca_${randomString(5)}` };
    const brandRes = await fetch(`${API_BASE_URL}/brands`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(brandPayload)
    });
    const brand = await brandRes.json();
    if (!brandRes.ok) throw new Error(`Erro na Brand: ${JSON.stringify(brand)}`);
    console.log(`✅ Brand criado: ID ${brand.id} | Nome: ${brand.name}\n`);

    // 2. Criar Model
    console.log('2️⃣ Criando Model...');
    const modelPayload = { 
        name: `Modelo_${randomString(5)}`, 
        brand_id: brand.id 
    };
    const modelRes = await fetch(`${API_BASE_URL}/models`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(modelPayload)
    });
    const model = await modelRes.json();
    if (!modelRes.ok) throw new Error(`Erro no Model: ${JSON.stringify(model)}`);
    console.log(`✅ Model criado: ID ${model.id} | Nome: ${model.name}\n`);

    // 3. Criar Vehicle
    console.log('3️⃣ Criando Vehicle...');
    const vehiclePayload = {
      license_plate: generatePlate(),
      chassis: generateChassis(),
      renavam: generateRenavam(),
      year: generateYear(),
      model_id: model.id
    };
    
    const vehicleRes = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(vehiclePayload)
    });
    const vehicle = await vehicleRes.json();
    
    // Tratamento rigoroso para pegar os erros do class-validator
    if (!vehicleRes.ok) {
      console.error('❌ O NestJS recusou o payload do Veículo. Erro retornado:');
      console.dir(vehicle, { depth: null, colors: true });
      return; // Interrompe o script aqui
    }
    
    console.log(`✅ Vehicle criado: Placa ${vehicle.license_plate} | ID ${vehicle.id}\n`);

    // 4. Buscar todos os Vehicles
    console.log('4️⃣ Buscando todos os Vehicles...');
    const allVehiclesRes = await fetch(`${API_BASE_URL}/vehicles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const allVehicles = await allVehiclesRes.json();
    
    console.log(`✅ Busca concluída! Total de veículos: ${allVehicles.length || (Array.isArray(allVehicles) ? allVehicles.length : 'N/A')}`);
    console.log('Resultado completo:');
    console.dir(allVehicles, { depth: null, colors: true });

  } catch (error) {
    console.error('\n❌ Falha na requisição:', error.message);
  }
}

// Executar
runSeed();