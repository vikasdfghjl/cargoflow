import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, MapPin, Phone, Star, Home, Building2, Warehouse, MapIcon } from 'lucide-react';
import LocationPicker, { LocationData } from './LocationPicker';
import {
  validateContactName,
  validatePhone,
  validatePostalCode,
  formatPhoneForAPI,
  formatContactNameForAPI,
  formatPostalCodeForAPI,
  ValidationResult
} from '@/utils/validation';

// API utility for making authenticated requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message: string; data?: T; error?: string }> {
  const API_BASE_URL = 'http://localhost:5000/api/v1';
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
}

interface Address {
  _id: string;
  label: string;
  type: 'home' | 'office' | 'warehouse' | 'other';
  contactName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  landmark?: string;
  instructions?: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  formattedAddress?: string;
  placeId?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  label: string;
  type: 'home' | 'office' | 'warehouse' | 'other';
  contactName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  landmark: string;
  instructions: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  formattedAddress?: string;
  placeId?: string;
}

const AddressManager: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    label: '',
    type: 'home',
    contactName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    landmark: '',
    instructions: '',
    isDefault: false,
    coordinates: undefined,
    formattedAddress: undefined,
    placeId: undefined
  });

  // Use ref to store current formData to avoid callback dependencies
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Fetch addresses from API
  const fetchAddresses = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest<Address[]>('/addresses');
      setAddresses(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load addresses on component mount
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = useCallback((locationData: LocationData) => {
    // Auto-fill address fields from location data
    const updates: Partial<FormData> = {
      coordinates: locationData.coordinates,
      formattedAddress: locationData.formattedAddress,
      placeId: locationData.placeId
    };

    // If address components are available, use them to fill form fields
    if (locationData.addressComponents) {
      const currentForm = formDataRef.current;
      if (locationData.addressComponents.street && !currentForm.street) {
        updates.street = locationData.addressComponents.street;
      }
      if (locationData.addressComponents.city && !currentForm.city) {
        updates.city = locationData.addressComponents.city;
      }
      if (locationData.addressComponents.state && !currentForm.state) {
        updates.state = locationData.addressComponents.state;
      }
      if (locationData.addressComponents.zipCode && !currentForm.zipCode) {
        updates.zipCode = locationData.addressComponents.zipCode;
      }
      if (locationData.addressComponents.country && !currentForm.country) {
        updates.country = locationData.addressComponents.country;
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
  }, []); // No dependencies - stable function

  const resetForm = () => {
    setFormData({
      label: '',
      type: 'home',
      contactName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      landmark: '',
      instructions: '',
      isDefault: false,
      coordinates: undefined,
      formattedAddress: undefined,
      placeId: undefined
    });
    setEditingAddress(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    setFormData({
      label: address.label,
      type: address.type,
      contactName: address.contactName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country || 'India',
      landmark: address.landmark || '',
      instructions: address.instructions || '',
      isDefault: address.isDefault,
      coordinates: address.coordinates,
      formattedAddress: address.formattedAddress,
      placeId: address.placeId
    });
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      const contactNameValidation = validateContactName(formData.contactName);
      if (!contactNameValidation.isValid) {
        setError(`Contact name error: ${contactNameValidation.error}`);
        setSubmitting(false);
        return;
      }

      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        setError(`Phone number error: ${phoneValidation.error}`);
        setSubmitting(false);
        return;
      }

      const postalCodeValidation = validatePostalCode(formData.zipCode);
      if (!postalCodeValidation.isValid) {
        setError(`Postal code error: ${postalCodeValidation.error}`);
        setSubmitting(false);
        return;
      }

      // Format data for API submission
      const cleanedFormData = {
        ...formData,
        contactName: formatContactNameForAPI(formData.contactName),
        phone: formatPhoneForAPI(formData.phone),
        zipCode: formatPostalCodeForAPI(formData.zipCode),
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        label: formData.label.trim(),
        landmark: formData.landmark.trim() || undefined,
        instructions: formData.instructions.trim() || undefined
      };

      console.log('Submitting address data:', cleanedFormData);
      console.log('Editing address:', editingAddress);

      if (editingAddress) {
        console.log('Updating address with ID:', editingAddress._id);
        // Update existing address
        const response = await apiRequest(`/addresses/${editingAddress._id}`, {
          method: 'PUT',
          body: JSON.stringify(cleanedFormData)
        });
        console.log('Update response:', response);
        setSuccess('Address updated successfully!');
      } else {
        console.log('Creating new address');
        // Create new address
        const response = await apiRequest('/addresses', {
          method: 'POST',
          body: JSON.stringify(cleanedFormData)
        });
        console.log('Create response:', response);
        setSuccess('Address added successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAddresses(); // Refresh the list
    } catch (err) {
      console.error('Address submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await apiRequest(`/addresses/${addressId}`, {
        method: 'DELETE'
      });
      setSuccess('Address deleted successfully!');
      fetchAddresses(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await apiRequest(`/addresses/${addressId}/default`, {
        method: 'PATCH'
      });
      setSuccess('Default address updated successfully!');
      fetchAddresses(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default address');
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'office':
        return <Building2 className="h-4 w-4" />;
      case 'warehouse':
        return <Warehouse className="h-4 w-4" />;
      default:
        return <MapIcon className="h-4 w-4" />;
    }
  };

  const getAddressTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'home':
        return 'bg-blue-100 text-blue-800';
      case 'office':
        return 'bg-green-100 text-green-800';
      case 'warehouse':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Saved Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading addresses...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Saved Addresses
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAddress 
                      ? 'Update your address information below.'
                      : 'Add a new address to save time on future bookings.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-6">
                    {/* Location Picker Section */}
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <MapIcon className="h-5 w-5 text-blue-600" />
                          <Label className="text-base font-medium">Location Selection</Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCurrentLocation}
                          disabled={loadingCurrentLocation}
                          className="flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4" />
                          {loadingCurrentLocation ? 'Getting Location...' : 'Current Location'}
                        </Button>
                      </div>
                      
                      <LocationPicker
                        initialLocation={{
                          lat: formData.coordinates?.latitude || 28.6139,
                          lng: formData.coordinates?.longitude || 77.2090
                        }}
                        onLocationSelect={handleLocationSelect}
                        className="h-64"
                      />
                    </div>

                    {/* Address Form Fields */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="label">Address Label *</Label>
                          <Input
                            id="label"
                            name="label"
                            value={formData.label}
                            onChange={handleInputChange}
                            placeholder="e.g., Home, Office, Warehouse"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type">Address Type</Label>
                          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pickup">Pickup Location</SelectItem>
                              <SelectItem value="delivery">Delivery Location</SelectItem>
                              <SelectItem value="warehouse">Warehouse</SelectItem>
                              <SelectItem value="office">Office</SelectItem>
                              <SelectItem value="residential">Residential</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="addressLine1">Street Address *</Label>
                        <Input
                          id="addressLine1"
                          name="addressLine1"
                          value={formData.addressLine1}
                          onChange={handleInputChange}
                          placeholder="House/Building number and street name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="addressLine2">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          name="addressLine2"
                          value={formData.addressLine2}
                          onChange={handleInputChange}
                          placeholder="Apartment, suite, unit, etc."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="City"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="State"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code *</Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            placeholder="ZIP Code"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          placeholder="Country"
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-blue-600" />
                        <Label className="text-base font-medium">Contact Information</Label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactPerson">Contact Person</Label>
                          <Input
                            id="contactPerson"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleInputChange}
                            placeholder="Contact person name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contactPhone">Contact Phone</Label>
                          <Input
                            id="contactPhone"
                            name="contactPhone"
                            value={formData.contactPhone}
                            onChange={handleInputChange}
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="notes">Special Instructions</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Any special delivery instructions or notes..."
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isDefault"
                          checked={formData.isDefault}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                        />
                        <Label htmlFor="isDefault" className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Set as default address
                        </Label>
                      </div>
                    </div>

                    {/* Coordinates Display (for reference) */}
                    {formData.coordinates && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Location Coordinates:</span>
                          </div>
                          <div className="ml-6 space-y-1">
                            <div>Latitude: {formData.coordinates.latitude.toFixed(6)}</div>
                            <div>Longitude: {formData.coordinates.longitude.toFixed(6)}</div>
                            {formData.formattedAddress && (
                              <div className="text-gray-500">Address: {formData.formattedAddress}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                    
                    <TabsContent value="manual" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="label">Address Label *</Label>
                          <Input
                            id="label"
                            value={formData.label}
                            onChange={(e) => handleInputChange('label', e.target.value)}
                            placeholder="e.g., Home, Main Office"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Address Type *</Label>
                          <Select value={formData.type} onValueChange={(value: 'home' | 'office' | 'warehouse' | 'other') => handleInputChange('type', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="home">Home</SelectItem>
                              <SelectItem value="office">Office</SelectItem>
                              <SelectItem value="warehouse">Warehouse</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactName">Contact Name *</Label>
                          <Input
                            id="contactName"
                            value={formData.contactName}
                            onChange={(e) => handleInputChange('contactName', e.target.value)}
                            placeholder="Full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+91 98765 43210"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="street">Street Address *</Label>
                        <Textarea
                          id="street"
                          value={formData.street}
                          onChange={(e) => handleInputChange('street', e.target.value)}
                          placeholder="House/Building number, Street name"
                          required
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="City name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            placeholder="State name"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zipCode">ZIP Code *</Label>
                          <Input
                            id="zipCode"
                            value={formData.zipCode}
                            onChange={(e) => handleInputChange('zipCode', e.target.value)}
                            placeholder="123456"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            placeholder="India"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          value={formData.landmark}
                          onChange={(e) => handleInputChange('landmark', e.target.value)}
                          placeholder="Near shopping mall, metro station, etc."
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="map" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="label-map">Address Label *</Label>
                          <Input
                            id="label-map"
                            value={formData.label}
                            onChange={(e) => handleInputChange('label', e.target.value)}
                            placeholder="e.g., Home, Main Office"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="type-map">Address Type *</Label>
                          <Select value={formData.type} onValueChange={(value: 'home' | 'office' | 'warehouse' | 'other') => handleInputChange('type', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="home">Home</SelectItem>
                              <SelectItem value="office">Office</SelectItem>
                              <SelectItem value="warehouse">Warehouse</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactName-map">Contact Name *</Label>
                          <Input
                            id="contactName-map"
                            value={formData.contactName}
                            onChange={(e) => handleInputChange('contactName', e.target.value)}
                            placeholder="Full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone-map">Phone Number *</Label>
                          <Input
                            id="phone-map"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+91 98765 43210"
                            required
                          />
                        </div>
                      </div>

                      <LocationPicker
                        onLocationSelect={handleLocationSelect}
                        initialLocation={
                          formData.coordinates ? {
                            coordinates: formData.coordinates,
                            formattedAddress: formData.formattedAddress || '',
                            placeId: formData.placeId
                          } : undefined
                        }
                      />

                      {/* Auto-filled fields from map selection */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="street-map">Street Address *</Label>
                          <Textarea
                            id="street-map"
                            value={formData.street}
                            onChange={(e) => handleInputChange('street', e.target.value)}
                            placeholder="Auto-filled from map or enter manually"
                            required
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city-map">City *</Label>
                            <Input
                              id="city-map"
                              value={formData.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              placeholder="Auto-filled from map"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="state-map">State *</Label>
                            <Input
                              id="state-map"
                              value={formData.state}
                              onChange={(e) => handleInputChange('state', e.target.value)}
                              placeholder="Auto-filled from map"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="zipCode-map">ZIP Code *</Label>
                            <Input
                              id="zipCode-map"
                              value={formData.zipCode}
                              onChange={(e) => handleInputChange('zipCode', e.target.value)}
                              placeholder="Auto-filled from map"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="country-map">Country</Label>
                            <Input
                              id="country-map"
                              value={formData.country}
                              onChange={(e) => handleInputChange('country', e.target.value)}
                              placeholder="Auto-filled from map"
                            />
                          </div>
                        </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : (editingAddress ? 'Update' : 'Add')} Address
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
              <p className="text-gray-500 mb-4">
                Add your first address to save time on future bookings
              </p>
              <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {addresses.map((address, index) => (
                <Card key={address._id || `address-${index}`} className={`relative ${address.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getAddressTypeIcon(address.type)}
                        <div>
                          <CardTitle className="text-base">{address.label}</CardTitle>
                          {address.isDefault && (
                            <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-800">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge className={getAddressTypeBadgeColor(address.type)}>
                        {address.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{address.contactName}</div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {address.phone}
                      </div>
                      <div className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{address.street}</div>
                          <div>{address.city}, {address.state} {address.zipCode}</div>
                          {address.country && <div>{address.country}</div>}
                          {address.landmark && (
                            <div className="text-gray-500 text-xs mt-1">
                              Near: {address.landmark}
                            </div>
                          )}
                          {address.coordinates && (
                            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                              <MapPin className="h-3 w-3" />
                              GPS Location Available
                            </div>
                          )}
                        </div>
                      </div>
                      {address.instructions && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <strong>Instructions:</strong> {address.instructions}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(address)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {!address.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address._id)}
                          className="flex-1"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(address._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressManager;
