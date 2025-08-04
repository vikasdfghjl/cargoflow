import { ApiResponse, Booking } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface BookingDraft {
  draftId: string;
  data: DraftData;
  lastModified: Date;
  expiresAt: Date;
}

export interface DraftData {
  pickupAddress?: {
    address?: string;
    contactName?: string;
    phone?: string;
    city?: string;
    postalCode?: string;
  };
  deliveryAddress?: {
    address?: string;
    contactName?: string;
    phone?: string;
    city?: string;
    postalCode?: string;
  };
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  serviceType?: 'standard' | 'express' | 'same_day';
  packageType?: 'document' | 'package' | 'fragile' | 'bulk';
  pickupDate?: string;
  specialInstructions?: string;
  insurance?: boolean;
  insuranceValue?: number;
}

class StatelessBookingService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data.data as T;
  }

  // Create a new booking with optimized async/await
  async createBooking(bookingData: DraftData): Promise<Booking> {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(bookingData),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Create booking service error:', error);
      throw error;
    }
  }

  // Save booking draft with enhanced async handling
  async saveDraft(draftData: DraftData, draftId?: string): Promise<{ draftId: string }> {
    try {
      const url = draftId 
        ? `${API_BASE_URL}/bookings/drafts/${draftId}`
        : `${API_BASE_URL}/bookings/drafts`;
      
      const method = draftId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: this.getAuthHeaders(),
        body: JSON.stringify(draftData),
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Save draft service error:', error);
      throw error;
    }
  }

  // Get specific draft
  async getDraft(draftId: string): Promise<DraftData> {
    const response = await fetch(`${API_BASE_URL}/bookings/drafts/${draftId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Get all user drafts
  async getUserDrafts(): Promise<BookingDraft[]> {
    const response = await fetch(`${API_BASE_URL}/bookings/drafts`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Delete draft
  async deleteDraft(draftId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/bookings/drafts/${draftId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    await this.handleResponse(response);
  }

  // Auto-save draft (for real-time saving)
  async autoSaveDraft(partialData: Partial<DraftData>): Promise<{ draftId: string; lastSaved: Date }> {
    const response = await fetch(`${API_BASE_URL}/bookings/drafts/autosave`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(partialData),
    });
    
    return this.handleResponse(response);
  }

  // Get user bookings
  async getUserBookings(): Promise<Booking[]> {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse(response);
  }
}

export const statelessBookingService = new StatelessBookingService();

// Hook for auto-saving drafts with debouncing
export class DraftAutoSaver {
  private timer: NodeJS.Timeout | null = null;
  private readonly delay: number;

  constructor(delay = 2000) { // 2 second delay
    this.delay = delay;
  }

  // Auto-save with debouncing
  autoSave(data: Partial<DraftData>): Promise<{ draftId: string; lastSaved: Date }> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (this.timer) {
        clearTimeout(this.timer);
      }

      // Set new timer
      this.timer = setTimeout(async () => {
        try {
          const result = await statelessBookingService.autoSaveDraft(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.delay);
    });
  }

  // Cancel pending auto-save
  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export default statelessBookingService;
