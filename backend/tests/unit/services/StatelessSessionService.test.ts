// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { StatelessSessionService, BookingDraftService } from '../../../src/services/StatelessSessionService';
import Session, { ISession } from '../../../src/models/Session';
import { TestHelpers } from '../../utils/testHelpers';
import { Types } from 'mongoose';

// Mock the Session model with proper static method mocking
jest.mock('../../../src/models/Session', () => ({
  __esModule: true,
  default: {
    createSession: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    deleteOne: jest.fn(),
    create: jest.fn(),
    getAndRefreshSession: jest.fn()
  }
}));

// Helper function to create mock ISession object
const createMockSession = (overrides: Partial<ISession> = {}): ISession => ({
  _id: new Types.ObjectId(),
  sessionId: 'test-session-id',
  userId: new Types.ObjectId(),
  data: {},
  type: 'user_session',
  expiresAt: new Date(Date.now() + 60000),
  createdAt: new Date(),
  updatedAt: new Date(),
  lastAccessed: new Date(),
  ...overrides
} as ISession);

describe('StatelessSessionService', () => {
  const mockSession = Session as jest.Mocked<typeof Session>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should create a new session', async () => {
      // Arrange
      const sessionData = {
        userId: 'user123',
        data: { test: 'data' },
        type: 'user_session' as ISession['type']
      };
      
      mockSession.createSession.mockResolvedValue('test-session-id');

      // Act
      const sessionId = await StatelessSessionService.createSession(sessionData);

      // Assert
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(mockSession.createSession).toHaveBeenCalledWith({
        sessionId: expect.any(String),
        userId: sessionData.userId,
        data: sessionData.data,
        type: sessionData.type,
        expiryMinutes: undefined,
        ipAddress: undefined,
        userAgent: undefined
      });
    });

    it('should create session with custom expiry', async () => {
      // Arrange
      const sessionData = {
        userId: 'user123',
        data: { test: 'data' },
        type: 'user_session' as ISession['type'],
        expiryMinutes: 120
      };

      // Act
      await StatelessSessionService.createSession(sessionData);

      // Assert
      expect((Session as any).createSession).toHaveBeenCalledWith({
        sessionId: expect.any(String),
        userId: sessionData.userId,
        data: sessionData.data,
        type: sessionData.type,
        expiryMinutes: 120,
        ipAddress: undefined,
        userAgent: undefined
      });
    });

    it('should retrieve session data by session ID', async () => {
      // Arrange
      const mockSession = {
        sessionId: 'test-session-id',
        userId: 'user123',
        data: { test: 'data' },
        type: 'user_session',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000)
      };
      
      (Session as any).findValidSession.mockResolvedValue(mockSession);

      // Act
      const retrievedSession = await StatelessSessionService.getSession('test-session-id');

      // Assert
      expect(retrievedSession).toEqual(mockSession);
      expect((Session as any).findValidSession).toHaveBeenCalledWith('test-session-id', true);
    });

    it('should retrieve session without extending it', async () => {
      // Arrange
      const mockSession = {
        sessionId: 'test-session-id',
        data: { test: 'data' }
      };
      
      (Session as any).findValidSession.mockResolvedValue(mockSession);

      // Act
      const retrievedSession = await StatelessSessionService.getSession('test-session-id', false);

      // Assert
      expect(retrievedSession).toEqual(mockSession);
      expect((Session as any).findValidSession).toHaveBeenCalledWith('test-session-id', false);
    });

    it('should return null for non-existent session', async () => {
      // Arrange
      (Session as any).findValidSession.mockResolvedValue(null);

      // Act
      const result = await StatelessSessionService.getSession('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should update session data', async () => {
      // Arrange
      const updateData = { newField: 'new value' };
      (Session as any).updateSession.mockResolvedValue(true);

      // Act
      const updated = await StatelessSessionService.updateSession('test-session-id', updateData);

      // Assert
      expect(updated).toBe(true);
      expect((Session as any).updateSession).toHaveBeenCalledWith('test-session-id', updateData, undefined);
    });

    it('should update session with custom expiry', async () => {
      // Arrange
      const updateData = { newField: 'new value' };
      (Session as any).updateSession.mockResolvedValue(true);

      // Act
      const updated = await StatelessSessionService.updateSession('test-session-id', updateData, 240);

      // Assert
      expect(updated).toBe(true);
      expect((Session as any).updateSession).toHaveBeenCalledWith('test-session-id', updateData, 240);
    });

    it('should delete session', async () => {
      // Arrange
      (Session as any).deleteSession.mockResolvedValue(true);

      // Act
      const deleted = await StatelessSessionService.deleteSession('test-session-id');

      // Assert
      expect(deleted).toBe(true);
      expect((Session as any).deleteSession).toHaveBeenCalledWith('test-session-id');
    });

    it('should return false when deleting non-existent session', async () => {
      // Arrange
      (Session as any).deleteSession.mockResolvedValue(false);

      // Act
      const result = await StatelessSessionService.deleteSession('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('User Session Management', () => {
    it('should get all sessions for user', async () => {
      // Arrange
      const mockSessions = [
        { sessionId: 'session1', userId: 'user123', type: 'user_session' },
        { sessionId: 'session2', userId: 'user123', type: 'booking_draft' }
      ];
      
      (Session as any).getUserSessions.mockResolvedValue(mockSessions);

      // Act
      const userSessions = await StatelessSessionService.getUserSessions('user123');

      // Assert
      expect(userSessions).toEqual(mockSessions);
      expect((Session as any).getUserSessions).toHaveBeenCalledWith('user123', undefined);
    });

    it('should get sessions by type for user', async () => {
      // Arrange
      const mockSessions = [
        { sessionId: 'session1', userId: 'user123', type: 'booking_draft' }
      ];
      
      (Session as any).getUserSessions.mockResolvedValue(mockSessions);

      // Act
      const userSessions = await StatelessSessionService.getUserSessions('user123', 'booking_draft');

      // Assert
      expect(userSessions).toEqual(mockSessions);
      expect((Session as any).getUserSessions).toHaveBeenCalledWith('user123', 'booking_draft');
    });

    it('should upsert user session', async () => {
      // Arrange
      const mockSession = {
        sessionId: 'test-session-id',
        userId: 'user123',
        type: 'user_session',
        data: { test: 'data' }
      };
      
      (Session as any).upsertUserSession.mockResolvedValue(mockSession);

      // Act
      const session = await StatelessSessionService.upsertUserSession(
        'user123',
        'user_session',
        { test: 'data' }
      );

      // Assert
      expect(session).toEqual(mockSession);
      expect((Session as any).upsertUserSession).toHaveBeenCalledWith(
        'user123',
        'user_session',
        { test: 'data' },
        undefined
      );
    });

    it('should upsert user session with custom expiry', async () => {
      // Arrange
      const mockSession = {
        sessionId: 'test-session-id',
        userId: 'user123',
        type: 'user_session',
        data: { test: 'data' }
      };
      
      (Session as any).upsertUserSession.mockResolvedValue(mockSession);

      // Act
      const session = await StatelessSessionService.upsertUserSession(
        'user123',
        'user_session',
        { test: 'data' },
        480
      );

      // Assert
      expect(session).toEqual(mockSession);
      expect((Session as any).upsertUserSession).toHaveBeenCalledWith(
        'user123',
        'user_session',
        { test: 'data' },
        480
      );
    });
  });
});

describe('BookingDraftService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks for StatelessSessionService
    jest.spyOn(StatelessSessionService, 'createSession').mockResolvedValue('test-draft-id');
    jest.spyOn(StatelessSessionService, 'updateSession').mockResolvedValue(createMockSession());
    jest.spyOn(StatelessSessionService, 'getSession').mockResolvedValue(null);
    jest.spyOn(StatelessSessionService, 'deleteSession').mockResolvedValue(true);
    jest.spyOn(StatelessSessionService, 'getUserSessions').mockResolvedValue([]);
    jest.spyOn(StatelessSessionService, 'upsertUserSession').mockResolvedValue(createMockSession());
  });

  describe('Draft Management', () => {
    it('should save a new booking draft', async () => {
      // Arrange
      const userId = 'user123';
      const draftData = {
        pickupAddress: 'Test pickup',
        deliveryAddress: 'Test delivery'
      };

      // Act
      const draftId = await BookingDraftService.saveDraft(userId, draftData);

      // Assert
      expect(draftId).toBe('test-draft-id');
      expect(StatelessSessionService.createSession).toHaveBeenCalledWith({
        userId,
        data: draftData,
        type: 'booking_draft',
        expiryMinutes: 24 * 60
      });
    });

    it('should update existing booking draft', async () => {
      // Arrange
      const userId = 'user123';
      const draftId = 'existing-draft-id';
      const draftData = {
        pickupAddress: 'Updated pickup',
        deliveryAddress: 'Updated delivery'
      };

      // Act
      const resultId = await BookingDraftService.saveDraft(userId, draftData, draftId);

      // Assert
      expect(resultId).toBe(draftId);
      expect(StatelessSessionService.updateSession).toHaveBeenCalledWith(draftId, draftData, 24 * 60);
      expect(StatelessSessionService.createSession).not.toHaveBeenCalled();
    });

    it('should retrieve draft by ID', async () => {
      // Arrange
      const mockSession: Partial<ISession> = {
        sessionId: 'test-draft-id',
        data: {
          pickupAddress: 'Test pickup',
          deliveryAddress: 'Test delivery'
        },
        type: 'booking_draft',
        userId: new Types.ObjectId()
      };
      
      jest.spyOn(StatelessSessionService, 'getSession').mockResolvedValue(mockSession as ISession);

      // Act
      const draftData = await BookingDraftService.getDraft('test-draft-id');

      // Assert
      expect(draftData).toEqual(mockSession.data);
      expect(StatelessSessionService.getSession).toHaveBeenCalledWith('test-draft-id');
    });

    it('should return null for non-existent draft', async () => {
      // Arrange
      jest.spyOn(StatelessSessionService, 'getSession').mockResolvedValue(null);

      // Act
      const result = await BookingDraftService.getDraft('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should get all drafts for user', async () => {
      // Arrange
      const mockSessions = [
        createMockSession({ sessionId: 'draft1', data: { pickup: 'Address 1' }, type: 'booking_draft' }),
        createMockSession({ sessionId: 'draft2', data: { pickup: 'Address 2' }, type: 'booking_draft' })
      ];
      
      jest.spyOn(StatelessSessionService, 'getUserSessions').mockResolvedValue(mockSessions);

      // Act
      const userDrafts = await BookingDraftService.getUserDrafts('user123');

      // Assert
      expect(userDrafts).toEqual(mockSessions);
      expect(StatelessSessionService.getUserSessions).toHaveBeenCalledWith('user123', 'booking_draft');
    });

    it('should delete draft', async () => {
      // Arrange
      jest.spyOn(StatelessSessionService, 'deleteSession').mockResolvedValue(true);

      // Act
      const deleted = await BookingDraftService.deleteDraft('test-draft-id');

      // Assert
      expect(deleted).toBe(true);
      expect(StatelessSessionService.deleteSession).toHaveBeenCalledWith('test-draft-id');
    });

    it('should auto-save draft', async () => {
      // Arrange
      const mockSession = createMockSession({
        sessionId: 'auto-save-id',
        userId: new Types.ObjectId(),
        type: 'booking_draft',
        data: { pickup: 'Auto-saved address' }
      });
      
      jest.spyOn(StatelessSessionService, 'upsertUserSession').mockResolvedValue(mockSession);

      // Act
      const session = await BookingDraftService.autoSaveDraft('user123', { pickup: 'Auto-saved address' });

      // Assert
      expect(session).toEqual(mockSession);
      expect(StatelessSessionService.upsertUserSession).toHaveBeenCalledWith(
        'user123',
        'booking_draft',
        { pickup: 'Auto-saved address' },
        24 * 60
      );
    });
  });
});
