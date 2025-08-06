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
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Address {
  _id?: string;
  label: string;
  type: 'home' | 'office' | 'warehouse' | 'other';
  street: string; // Changed from addressLine1 to match backend
  addressLine2?: string; // This will be stored in landmark or instructions
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactName: string; // Required field matching backend
  phone: string; // Required field matching backend
  landmark?: string;
  instructions?: string;
  isDefault: boolean;
  coordinates?: Coordinates;
  formattedAddress?: string;
  placeId?: string;
}

// FormData is now identical to Address since we aligned with backend schema
type FormData = Address;

// Validation errors interface
interface ValidationErrors {
  contactName?: string;
  phone?: string;
  zipCode?: string;
  [key: string]: string | undefined;
}

const AddressManager: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Form ref for submission outside form
  const formRef = useRef<HTMLFormElement>(null);

  // Form data with refs pattern for stable LocationPicker integration
  const formDataRef = useRef<FormData>({
    label: '',
    type: 'home', // Changed from 'pickup' to match backend enum
    street: '', // Changed from addressLine1 to match backend
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    contactName: '', // Required field
    phone: '', // Required field
    landmark: '',
    instructions: '',
    isDefault: false,
    coordinates: undefined,
    formattedAddress: '',
    placeId: undefined
  });
  
  const [formData, setFormData] = useState<FormData>(formDataRef.current);

  // Stable location select handler with refs pattern
  const handleLocationSelect = useCallback((locationData: LocationData) => {
    const updatedData = {
      ...formDataRef.current,
      coordinates: {
        latitude: locationData.coordinates.latitude,
        longitude: locationData.coordinates.longitude
      },
      formattedAddress: locationData.formattedAddress || '',
      placeId: locationData.placeId || '',
      // Auto-fill address fields if available from geocoding
      street: locationData.addressComponents?.street || formDataRef.current.street, // Changed from addressLine1
      city: locationData.addressComponents?.city || formDataRef.current.city,
      state: locationData.addressComponents?.state || formDataRef.current.state,
      zipCode: locationData.addressComponents?.zipCode || formDataRef.current.zipCode,
      country: locationData.addressComponents?.country || formDataRef.current.country
    };
    
    formDataRef.current = updatedData;
    setFormData(updatedData);
  }, []);

  // Load addresses on component mount
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await apiRequest<Address[]>('/addresses');
      if (response.success && response.data) {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      setError('Failed to load addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    const initialData: FormData = {
      label: '',
      type: 'home' as const, // Changed to match backend enum
      street: '', // Changed from addressLine1
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      contactName: '', // Required field
      phone: '', // Required field
      landmark: '',
      instructions: '',
      isDefault: false,
      coordinates: undefined,
      formattedAddress: '',
      placeId: undefined
    };
    formDataRef.current = initialData;
    setFormData(initialData);
    setEditingAddress(null);
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    const editData: FormData = {
      ...address,
      // Address already has the correct field names, just ensure all required fields are present
      contactName: address.contactName || '', // Should already be correct
      phone: address.phone || '', // Should already be correct
      instructions: address.instructions || ''
    };
    formDataRef.current = editData;
    setFormData(editData);
    setEditingAddress(address);
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formDataRef.current, [name]: value };
    formDataRef.current = updatedData;
    setFormData(updatedData);
  };

  const handleCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setLoadingCurrentLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use LocationPicker's geocoding to get address details
      handleLocationSelect({
        coordinates: { latitude, longitude },
        formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Failed to get your current location. Please select manually on the map.');
    } finally {
      setLoadingCurrentLocation(false);
    }
  }, [handleLocationSelect]);

  const validateForm = (data: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate required field: label
    if (!data.label || data.label.trim().length === 0) {
      errors.label = 'Address label is required';
    }

    // Validate required field: street address
    if (!data.street || data.street.trim().length === 0) {
      errors.street = 'Street address is required';
    } else if (data.street.trim().length < 5 || data.street.trim().length > 200) {
      errors.street = 'Street address must be between 5 and 200 characters';
    }

    // Validate required field: contact name
    if (!data.contactName || data.contactName.trim().length === 0) {
      errors.contactName = 'Contact name is required';
    } else {
      const nameValidation = validateContactName(data.contactName);
      if (!nameValidation.isValid) {
        errors.contactName = nameValidation.error || 'Invalid contact name';
      }
    }

    // Validate required field: phone
    if (!data.phone || data.phone.trim().length === 0) {
      errors.phone = 'Phone number is required';
    } else {
      const phoneValidation = validatePhone(data.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error || 'Invalid phone number';
      }
    }

    // Validate required field: type
    if (!data.type || data.type.trim().length === 0) {
      errors.type = 'Address type is required';
    }

    // Validate required field: city
    if (!data.city || data.city.trim().length === 0) {
      errors.city = 'City is required';
    }

    // Validate required field: state
    if (!data.state || data.state.trim().length === 0) {
      errors.state = 'State is required';
    }

    // Validate required field: country
    if (!data.country || data.country.trim().length === 0) {
      errors.country = 'Country is required';
    }

    // Validate postal code (optional but validate format if provided)
    if (data.zipCode.trim()) {
      const postalValidation = validatePostalCode(data.zipCode);
      if (!postalValidation.isValid) {
        errors.zipCode = postalValidation.error || 'Invalid postal code';
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm(formData);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    
    try {
      // Prepare address data for API - match backend schema field names exactly
      const addressData: Partial<Address> = {
        label: formData.label,
        type: formData.type,
        street: formData.street, // Direct mapping now
        city: formData.city,
        state: formData.state,
        zipCode: formatPostalCodeForAPI(formData.zipCode),
        country: formData.country,
        contactName: formatContactNameForAPI(formData.contactName || ''),
        phone: formatPhoneForAPI(formData.phone || ''),
        landmark: formData.addressLine2 || formData.landmark, // Map addressLine2 to landmark
        instructions: formData.instructions,
        isDefault: formData.isDefault,
        coordinates: formData.coordinates,
        formattedAddress: formData.formattedAddress,
        placeId: formData.placeId
      };

      let response;
      if (editingAddress) {
        response = await apiRequest(`/addresses/${editingAddress._id}`, {
          method: 'PUT',
          body: JSON.stringify(addressData),
        });
      } else {
        response = await apiRequest('/addresses', {
          method: 'POST',
          body: JSON.stringify(addressData),
        });
      }

      if (response.success) {
        await loadAddresses();
        setIsDialogOpen(false);
        setError(null);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      setError(editingAddress ? 'Failed to update address' : 'Failed to add address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await apiRequest(`/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        await loadAddresses();
        setError(null);
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      setError('Failed to delete address');
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="h-4 w-4 text-green-600" />;
      case 'office': return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'warehouse': return <Warehouse className="h-4 w-4 text-orange-600" />;
      default: return <MapPin className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAddressTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'home': return 'bg-green-100 text-green-800';
      case 'office': return 'bg-blue-100 text-blue-800';
      case 'warehouse': return 'bg-orange-100 text-orange-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading addresses...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Saved Addresses</CardTitle>
              <p className="text-gray-600 text-sm mt-1">
                Manage your pickup and delivery locations
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
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
                
                <div className="flex-1 overflow-y-auto px-1">
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Location Picker Section */}
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 pb-8">
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
                          coordinates: {
                            latitude: formData.coordinates?.latitude || 28.6139,
                            longitude: formData.coordinates?.longitude || 77.2090
                          },
                          formattedAddress: formData.formattedAddress || ''
                        }}
                        onLocationSelect={handleLocationSelect}
                      />
                    </div>

                    {/* Address Form Fields */}
                    <div className="space-y-4 border-t border-gray-100 pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <Label className="text-base font-medium">Address Information</Label>
                      </div>
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
                        <Select value={formData.type} onValueChange={(value: Address['type']) => {
                          const updatedData = { ...formDataRef.current, type: value };
                          formDataRef.current = updatedData;
                          setFormData(updatedData);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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

                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder="House/Building number and street name"
                        required
                        className={validationErrors.street ? 'border-red-500' : ''}
                      />
                      {validationErrors.street && (
                        <p className="text-sm text-red-600">{validationErrors.street}</p>
                      )}
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
                          className={validationErrors.zipCode ? 'border-red-500' : ''}
                          required
                        />
                        {validationErrors.zipCode && (
                          <p className="text-red-500 text-xs">{validationErrors.zipCode}</p>
                        )}
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
                    <div className="space-y-3 border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Phone className="h-5 w-5 text-blue-600" />
                        <Label className="text-base font-medium">Contact Information</Label>
                      </div>                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Contact Person *</Label>
                        <Input
                          id="contactName"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleInputChange}
                          placeholder="Contact person name"
                          required
                          className={validationErrors.contactName ? 'border-red-500' : ''}
                        />
                        {validationErrors.contactName && (
                          <p className="text-red-500 text-xs">{validationErrors.contactName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Contact Phone *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Phone number"
                          required
                          className={validationErrors.phone ? 'border-red-500' : ''}
                        />
                        {validationErrors.phone && (
                          <p className="text-red-500 text-xs">{validationErrors.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4 border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="h-5 w-5 text-blue-600" />
                      <Label className="text-base font-medium">Additional Information</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Special Instructions</Label>
                      <Textarea
                        id="instructions"
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleInputChange}
                        placeholder="Any special delivery instructions or notes..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isDefault"
                        checked={formData.isDefault}
                        onCheckedChange={(checked) => {
                          const updatedData = { ...formDataRef.current, isDefault: checked };
                          formDataRef.current = updatedData;
                          setFormData(updatedData);
                        }}
                      />
                      <Label htmlFor="isDefault" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Set as default address
                      </Label>
                    </div>
                  </div>

                    {/* Coordinates Display (for reference) */}
                    {formData.coordinates && (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-gray-700">Selected Location Details</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-700">Coordinates:</div>
                              <div>Lat: {formData.coordinates.latitude.toFixed(6)}</div>
                              <div>Lng: {formData.coordinates.longitude.toFixed(6)}</div>
                            </div>
                            {formData.formattedAddress && (
                              <div className="space-y-1">
                                <div className="font-medium text-gray-700">Google Address:</div>
                                <div className="text-gray-600 break-words">{formData.formattedAddress}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                <DialogFooter className="flex-shrink-0 border-t border-gray-100 pt-4 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    disabled={submitting}
                    onClick={() => {
                      if (formRef.current) {
                        formRef.current.requestSubmit();
                      }
                    }}
                  >
                    {submitting ? 'Saving...' : (editingAddress ? 'Update' : 'Add')} Address
                  </Button>
                </DialogFooter>
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
                      <div>{address.street}</div>
                      {address.addressLine2 && <div>{address.addressLine2}</div>}
                      <div>{address.city}, {address.state} {address.zipCode}</div>
                      <div>{address.country}</div>
                      
                      {address.contactName && (
                        <div className="flex items-center gap-1 mt-2">
                          <Phone className="h-3 w-3" />
                          <span>{address.contactName}</span>
                          {address.phone && (
                            <span className="text-gray-500">• {address.phone}</span>
                          )}
                        </div>
                      )}
                      
                      {address.instructions && (
                        <div className="text-gray-500 text-xs mt-2 italic">
                          {address.instructions}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(address)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(address._id!)}
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
