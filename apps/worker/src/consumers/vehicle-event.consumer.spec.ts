import { VehicleEventConsumer } from './vehicle-event.consumer';
import { AuditService } from '../services/audit.service';
import { CacheService } from '../services/cache.service';
import { VehicleMutatedEventDto } from '@app/shared';
import { RmqContext } from '@nestjs/microservices';

describe('VehicleEventConsumer', () => {
  let consumer: VehicleEventConsumer;
  let auditService: jest.Mocked<AuditService>;
  let cacheService: jest.Mocked<CacheService>;
  let mockContext: jest.Mocked<RmqContext>;
  let mockChannel: { ack: jest.Mock; nack: jest.Mock };
  let mockOriginalMsg: Record<string, unknown>;

  const mockEvent: VehicleMutatedEventDto = {
    action: 'created',
    vehicleId: 'uuid-vehicle-1',
    timestamp: new Date('2026-06-06T12:00:00Z'),
    payload: { license_plate: 'ABC-1D23' },
  };

  beforeEach(() => {
    auditService = {
      saveAuditLog: jest.fn().mockResolvedValue(undefined),
    } as any;

    cacheService = {
      invalidateVehicleCache: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockChannel = {
      ack: jest.fn(),
      nack: jest.fn(),
    };

    mockOriginalMsg = { content: Buffer.from(JSON.stringify(mockEvent)) };

    mockContext = {
      getChannelRef: jest.fn().mockReturnValue(mockChannel),
      getMessage: jest.fn().mockReturnValue(mockOriginalMsg),
    } as any;

    consumer = new VehicleEventConsumer(auditService, cacheService);
  });

  // ── Processamento com sucesso ────────────────────────────────

  describe('handleVehicleMutated — sucesso', () => {
    it('deve salvar audit log, invalidar cache e fazer ack', async () => {
      // Arrange — tudo já configurado no beforeEach

      // Act
      await consumer.handleVehicleMutated(mockEvent, mockContext);

      // Assert
      expect(auditService.saveAuditLog).toHaveBeenCalledWith(mockEvent);
      expect(cacheService.invalidateVehicleCache).toHaveBeenCalledWith(mockEvent);
      expect(mockChannel.ack).toHaveBeenCalledWith(mockOriginalMsg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('deve processar evento de update corretamente', async () => {
      // Arrange
      const updateEvent: VehicleMutatedEventDto = {
        action: 'updated',
        vehicleId: 'uuid-vehicle-2',
        timestamp: new Date(),
        payload: { year: 2026 },
      };

      // Act
      await consumer.handleVehicleMutated(updateEvent, mockContext);

      // Assert
      expect(auditService.saveAuditLog).toHaveBeenCalledWith(updateEvent);
      expect(cacheService.invalidateVehicleCache).toHaveBeenCalledWith(updateEvent);
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('deve processar evento de delete corretamente', async () => {
      // Arrange
      const deleteEvent: VehicleMutatedEventDto = {
        action: 'deleted',
        vehicleId: 'uuid-vehicle-3',
        timestamp: new Date(),
      };

      // Act
      await consumer.handleVehicleMutated(deleteEvent, mockContext);

      // Assert
      expect(auditService.saveAuditLog).toHaveBeenCalledWith(deleteEvent);
      expect(mockChannel.ack).toHaveBeenCalled();
    });
  });

  // ── Processamento com erro ───────────────────────────────────

  describe('handleVehicleMutated — erro', () => {
    it('deve fazer nack com requeue quando auditService falha', async () => {
      // Arrange
      auditService.saveAuditLog.mockRejectedValue(
        new Error('MongoDB connection failed'),
      );

      // Act
      await consumer.handleVehicleMutated(mockEvent, mockContext);

      // Assert
      expect(mockChannel.nack).toHaveBeenCalledWith(mockOriginalMsg, false, true);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });

    it('deve fazer nack com requeue quando cacheService falha', async () => {
      // Arrange
      cacheService.invalidateVehicleCache.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      // Act
      await consumer.handleVehicleMutated(mockEvent, mockContext);

      // Assert
      expect(mockChannel.nack).toHaveBeenCalledWith(mockOriginalMsg, false, true);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });
  });
});
