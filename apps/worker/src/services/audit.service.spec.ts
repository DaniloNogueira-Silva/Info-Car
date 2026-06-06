import { AuditService } from './audit.service';
import { VehicleMutatedEventDto } from '@app/shared';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

describe('AuditService', () => {
  let service: AuditService;
  let mockAuditLogModel: jest.Mocked<Model<AuditLogDocument>>;
  let mockSave: jest.Mock;

  const mockEvent: VehicleMutatedEventDto = {
    action: 'created',
    vehicleId: 'uuid-vehicle-1',
    timestamp: new Date('2026-06-06T12:00:00Z'),
    payload: { license_plate: 'ABC-1D23', year: 2024 },
  };

  beforeEach(() => {
    mockSave = jest.fn().mockResolvedValue(undefined);

    // Simula o construtor do Mongoose Model
    mockAuditLogModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: mockSave,
    })) as any;

    service = new AuditService(mockAuditLogModel);
  });

  // ── saveAuditLog ─────────────────────────────────────────────

  describe('saveAuditLog', () => {
    it('deve criar documento com campos corretos e salvar', async () => {
      // Arrange — evento já definido

      // Act
      await service.saveAuditLog(mockEvent);

      // Assert
      expect(mockAuditLogModel).toHaveBeenCalledWith({
        action: 'created',
        vehicleId: 'uuid-vehicle-1',
        payload: mockEvent.payload,
        eventTimestamp: mockEvent.timestamp,
      });
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('deve salvar evento de delete sem payload', async () => {
      // Arrange
      const deleteEvent: VehicleMutatedEventDto = {
        action: 'deleted',
        vehicleId: 'uuid-vehicle-2',
        timestamp: new Date(),
      };

      // Act
      await service.saveAuditLog(deleteEvent);

      // Assert
      expect(mockAuditLogModel).toHaveBeenCalledWith({
        action: 'deleted',
        vehicleId: 'uuid-vehicle-2',
        payload: undefined,
        eventTimestamp: deleteEvent.timestamp,
      });
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro quando save falha', async () => {
      // Arrange
      mockSave.mockRejectedValue(new Error('MongoDB write failed'));

      // Act & Assert
      await expect(service.saveAuditLog(mockEvent)).rejects.toThrow(
        'MongoDB write failed',
      );
    });
  });
});
