import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FineOrmEntity } from '../../../api/src/fines/infrastructure/entities/fine.orm-entity';
import { RentalOrmEntity } from '../../../api/src/rentals/infrastructure/entities/rental.orm-entity';
import { VehicleOrmEntity } from '../../../api/src/vehicles/infrastructure/entities/vehicle.orm-entity';

@Controller()
export class FinesConsumer {
  private readonly logger = new Logger(FinesConsumer.name);

  constructor(
    @InjectRepository(FineOrmEntity)
    private readonly fineRepository: Repository<FineOrmEntity>,
    @InjectRepository(RentalOrmEntity)
    private readonly rentalRepository: Repository<RentalOrmEntity>,
    @InjectRepository(VehicleOrmEntity)
    private readonly vehicleRepository: Repository<VehicleOrmEntity>,
  ) {}

  @EventPattern('fine.received')
  async handleFineReceived(
    @Payload()
    data: {
      rentalId: string;
      amount: number;
      points: number;
      description: string;
    },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(
        `📥 Recebida notificação de multa via SNE para a locação: ${data.rentalId}`,
      );

      const fine = new FineOrmEntity();
      fine.rental_id = data.rentalId;
      fine.amount = data.amount;
      fine.points = data.points;
      fine.description = data.description;

      await this.fineRepository.save(fine);

      const finesCount = await this.fineRepository.count({
        where: { rental_id: data.rentalId },
      });

      const rental = await this.rentalRepository.findOne({
        where: { id: data.rentalId },
        relations: { customer: true, vehicle: true },
      });

      if (!rental) {
        this.logger.error(`Locação não encontrada: ${data.rentalId}`);
        channel.ack(originalMsg); // Ack to avoid infinite loop
        return;
      }

      if (finesCount >= 3) {
        rental.status = 'CANCELLED';
        await this.rentalRepository.save(rental);

        rental.vehicle.status = 'MAINTENANCE';
        await this.vehicleRepository.save(rental.vehicle);

        this.logger.warn(`\n======================================================
[EMAIL] PARA: ${rental.customer.email}
ASSUNTO: ALERTA CRÍTICO - LOCAÇÃO CANCELADA E VEÍCULO BLOQUEADO

Olá, ${rental.customer.name},
Notamos que o veículo ${rental.vehicle.license_plate} recebeu a 3ª multa sob a sua locação.
Por medidas de segurança e de acordo com nossas políticas, sua locação foi CANCELADA.
O veículo foi marcado para REVISÃO GERAL. Por favor, devolva-o imediatamente.
======================================================\n`);
      } else {
        this.logger.log(`\n======================================================
[EMAIL] PARA: ${rental.customer.email}
ASSUNTO: AVISO DE INFRAÇÃO DE TRÂNSITO

Olá, ${rental.customer.name},
Recebemos uma notificação de infração de trânsito vinculada ao veículo alugado (${rental.vehicle.license_plate}).
- Motivo: ${data.description}
- Pontos: ${data.points}
- Valor: R$ ${data.amount}
Você acumula um total de ${finesCount} multas nessa locação. Cuidado: 3 multas resultam em cancelamento.
======================================================\n`);
      }

      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Erro ao processar multa: ${error.message}`, error.stack);
      channel.nack(originalMsg, false, true); // requeue
    }
  }
}
