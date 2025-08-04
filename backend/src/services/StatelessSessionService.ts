import { Types } from 'mongoose';
import Session, { ISession } from '../models/Session';

export class StatelessSessionService {
  // Create a new session
  static async createSession(data: {
    userId?: string;
    data: Record<string, any>;
    type: ISession['type'];
    expiryMinutes?: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {
    const sessionId = new Types.ObjectId().toString();
    
    await (Session as any).createSession({
      sessionId,
      userId: data.userId,
      data: data.data,
      type: data.type,
      expiryMinutes: data.expiryMinutes,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });

    return sessionId;
  }

  // Get session data
  static async getSession(sessionId: string, extendSession = true): Promise<ISession | null> {
    if (extendSession) {
      return await (Session as any).getAndRefreshSession(sessionId);
    } else {
      return await Session.findOne({
        sessionId,
        expiresAt: { $gt: new Date() }
      });
    }
  }

  // Update session data
  static async updateSession(
    sessionId: string, 
    data: Record<string, any>, 
    extendMinutes = 60
  ): Promise<ISession | null> {
    const expiresAt = new Date(Date.now() + extendMinutes * 60 * 1000);
    
    return await Session.findOneAndUpdate(
      { 
        sessionId, 
        expiresAt: { $gt: new Date() } 
      },
      { 
        $set: { 
          data,
          lastAccessed: new Date(),
          expiresAt
        }
      },
      { new: true }
    );
  }

  // Merge data into existing session
  static async mergeSessionData(
    sessionId: string, 
    newData: Record<string, any>,
    extendMinutes = 60
  ): Promise<ISession | null> {
    const session = await Session.findOne({
      sessionId,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return null;
    }

    const mergedData = { ...session.data, ...newData };
    const expiresAt = new Date(Date.now() + extendMinutes * 60 * 1000);

    return await Session.findOneAndUpdate(
      { sessionId },
      { 
        $set: { 
          data: mergedData,
          lastAccessed: new Date(),
          expiresAt
        }
      },
      { new: true }
    );
  }

  // Delete session
  static async deleteSession(sessionId: string): Promise<boolean> {
    const result = await Session.deleteOne({ sessionId });
    return result.deletedCount > 0;
  }

  // Get all sessions for a user
  static async getUserSessions(
    userId: string, 
    type?: ISession['type']
  ): Promise<ISession[]> {
    const query: any = {
      userId,
      expiresAt: { $gt: new Date() }
    };

    if (type) {
      query.type = type;
    }

    return await Session.find(query).sort({ lastAccessed: -1 });
  }

  // Clean up expired sessions for a user
  static async cleanupUserSessions(userId: string): Promise<number> {
    const result = await Session.deleteMany({
      userId,
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount || 0;
  }

  // Clean up all expired sessions
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await Session.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount || 0;
  }

  // Get session by user and type (useful for unique sessions like cart)
  static async getUserSessionByType(
    userId: string, 
    type: ISession['type']
  ): Promise<ISession | null> {
    return await Session.findOne({
      userId,
      type,
      expiresAt: { $gt: new Date() }
    }).sort({ lastAccessed: -1 });
  }

  // Create or update user session by type
  static async upsertUserSession(
    userId: string,
    type: ISession['type'],
    data: Record<string, any>,
    expiryMinutes = 60
  ): Promise<ISession> {
    const existingSession = await this.getUserSessionByType(userId, type);
    
    if (existingSession) {
      const updated = await this.updateSession(existingSession.sessionId, data, expiryMinutes);
      return updated!;
    } else {
      const sessionId = await this.createSession({
        userId,
        data,
        type,
        expiryMinutes
      });
      return (await this.getSession(sessionId, false))!;
    }
  }
}

// Booking draft management using stateless sessions
export class BookingDraftService {
  // Save booking draft
  static async saveDraft(
    userId: string,
    draftData: Record<string, any>,
    draftId?: string
  ): Promise<string> {
    if (draftId) {
      // Update existing draft
      await StatelessSessionService.updateSession(draftId, draftData, 24 * 60); // 24 hours
      return draftId;
    } else {
      // Create new draft
      return await StatelessSessionService.createSession({
        userId,
        data: draftData,
        type: 'booking_draft',
        expiryMinutes: 24 * 60 // 24 hours
      });
    }
  }

  // Get booking draft
  static async getDraft(draftId: string): Promise<Record<string, any> | null> {
    const session = await StatelessSessionService.getSession(draftId);
    return session?.data || null;
  }

  // Get all drafts for user
  static async getUserDrafts(userId: string): Promise<ISession[]> {
    return await StatelessSessionService.getUserSessions(userId, 'booking_draft');
  }

  // Delete draft
  static async deleteDraft(draftId: string): Promise<boolean> {
    return await StatelessSessionService.deleteSession(draftId);
  }

  // Auto-save draft (merge with existing data)
  static async autoSaveDraft(
    userId: string,
    partialData: Record<string, any>
  ): Promise<ISession> {
    return await StatelessSessionService.upsertUserSession(
      userId,
      'booking_draft',
      partialData,
      24 * 60 // 24 hours
    );
  }
}

export default StatelessSessionService;
