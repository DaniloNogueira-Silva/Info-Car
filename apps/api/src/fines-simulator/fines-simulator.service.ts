import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { RentalOrmEntity } from '../rentals/infrastructure/entities/rental.orm-entity';
import { RABBITMQ_SERVICE } from '@app/shared';

@Injectable()
export class FinesSimulatorService {
  private readonly logger = new Logger(FinesSimulatorService.name);

  constructor(
    @InjectRepository(RentalOrmEntity)
    private readonly rentalRepository: Repository<RentalOrmEntity>,
    @Inject(RABBITMQ_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  @Cron('0 * * * * *') // Runs every minute
  async handleCron() {
    this.logger.log('🕵️ Buscando locações ativas para simular uma multa (SNE)...');

    const activeRentals = await this.rentalRepository.find({
      where: { status: 'ACTIVE' },
      relations: { vehicle: true, customer: true },
    });

    if (activeRentals.length === 0) {
      this.logger.log('Nenhuma locação ativa encontrada para simular multa.');
      return;
    }

    // Pega uma locação aleatória
    const randomRental = activeRentals[Math.floor(Math.random() * activeRentals.length)];
    
    const finePayload = {
      rentalId: randomRental.id,
      amount: Math.floor(Math.random() * 500) + 130, // Entre 130 e 630 reais
      points: Math.floor(Math.random() * 5) + 3, // Entre 3 e 7 pontos
      description: 'Excesso de velocidade simulado pelo Radar SNE',
    };

    this.logger.log(`🚦 Multa gerada para placa ${randomRental.vehicle.license_plate} (Locação: ${randomRental.id}). Enviando para a fila...`);
    
    this.client.emit('fine.received', finePayload);
  }
}
