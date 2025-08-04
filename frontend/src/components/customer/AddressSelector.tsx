import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Home, Building2, Warehouse, MapIcon } from 'lucide-react';

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
}

interface AddressSelectorProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: Address) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  onAddressSelect 
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);

  // Fetch saved addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await apiRequest<Address[]>('/addresses');
      setAddresses(response.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSavedAddresses) {
      fetchAddresses();
    }
  }, [showSavedAddresses]);

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

  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  const handleAddressSelect = (address: Address) => {
    const formattedAddress = formatAddress(address);
    onChange(formattedAddress);
    if (onAddressSelect) {
      onAddressSelect(address);
    }
    setShowSavedAddresses(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Dialog open={showSavedAddresses} onOpenChange={setShowSavedAddresses}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Choose Saved
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Saved Address</DialogTitle>
              <DialogDescription>
                Choose from your saved addresses or manually enter a new one.
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading addresses...</div>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h3>
                <p className="text-gray-500 mb-4">
                  You haven't saved any addresses yet. Add addresses from your address book to use them quickly in future bookings.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {addresses.map((address) => (
                  <Card 
                    key={address._id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      address.isDefault ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleAddressSelect(address)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {getAddressTypeIcon(address.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{address.label}</h4>
                              <Badge key="type-badge" className={getAddressTypeBadgeColor(address.type)}>
                                {address.type}
                              </Badge>
                              {address.isDefault && (
                                <Badge key="default-badge" variant="secondary" className="bg-blue-100 text-blue-800">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <div className="font-medium">{address.contactName}</div>
                              <div>{formatAddress(address)}</div>
                              {address.landmark && (
                                <div className="text-gray-500 text-xs mt-1">
                                  Near: {address.landmark}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSavedAddresses(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default AddressSelector;
