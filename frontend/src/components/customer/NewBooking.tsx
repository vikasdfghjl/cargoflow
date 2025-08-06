import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import AddressSelector from "./AddressSelector";
import { statelessBookingService } from "@/services/statelessBookingService";
import { validateCompleteAddress,
  validateWeight,
  validateContactName,
  validatePhone,
  validatePostalCode,
  validateCity,
  formatPhoneForAPI,
  formatContactNameForAPI,
  formatPostalCodeForAPI,
  formatCityForAPI,
  formatAddressForAPI,
  AddressData
} from "@/utils/validation";
import { 
  calculateDistance, 
  isValidCoordinates, 
  coordinatesChanged, 
  getTruckRoutingInfo,
  type Coordinates, 
  type DistanceResult 
} from "@/utils/distanceCalculation";

// Local form data interface (no longer using DraftData from service)
interface FormData {
  pickupAddress: Partial<AddressData> & {
    coordinates?: Coordinates;
    formattedAddress?: string;
    placeId?: string;
  };
  deliveryAddress: Partial<AddressData> & {
    coordinates?: Coordinates;
    formattedAddress?: string;
    placeId?: string;
  };
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  serviceType: 'standard' | 'express' | 'same_day';
  packageType?: 'document' | 'package' | 'fragile' | 'bulk';
  pickupDate?: string;
  specialInstructions?: string;
  insurance: boolean;
  insuranceValue?: number;
  // Distance calculation fields
  distance?: DistanceResult;
}
import { 
  MapPin, 
  Package, 
  Calendar,
  Clock,
  DollarSign,
  Truck,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Route
} from "lucide-react";

const NewBooking = () => {
  const [formData, setFormData] = useState<FormData>({
    pickupAddress: {},
    deliveryAddress: {},
    packageType: undefined,
    weight: undefined,
    serviceType: 'standard',
    pickupDate: undefined,
    specialInstructions: '',
    insurance: false,
    insuranceValue: undefined,
    distance: undefined
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Distance calculation state
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  // Service type options
  const serviceTypes = [
    {
      id: "standard" as const,
      name: "Standard Delivery",
      duration: "2-3 business days",
      price: "₹250",
      icon: Package,
      features: ["Door-to-door delivery", "Basic tracking", "Insurance up to ₹5,000"]
    },
    {
      id: "express" as const,
      name: "Express Delivery", 
      duration: "1-2 business days",
      price: "₹450",
      icon: Zap,
      features: ["Priority handling", "Real-time tracking", "Insurance up to ₹10,000"]
    },
    {
      id: "same_day" as const,
      name: "Same Day Delivery",
      duration: "Same day",
      price: "₹750",
      icon: Shield,
      features: ["Dedicated vehicle", "Live GPS tracking", "Insurance up to ₹25,000", "Direct contact with driver"]
    }
  ];

  // Distance calculation function
  const calculateDistanceBetweenAddresses = async (
    pickup?: Coordinates,
    delivery?: Coordinates
  ) => {
    if (!pickup || !delivery || !isValidCoordinates(pickup) || !isValidCoordinates(delivery)) {
      return;
    }

    // Skip calculation if coordinates haven't changed significantly
    if (formData.distance && 
        !coordinatesChanged(pickup, formData.pickupAddress?.coordinates) &&
        !coordinatesChanged(delivery, formData.deliveryAddress?.coordinates)) {
      return;
    }

    setCalculatingDistance(true);
    setDistanceError(null);

    try {
      const distanceResult = await calculateDistance(pickup, delivery);
      setFormData(prev => ({
        ...prev,
        distance: distanceResult
      }));
      
      // Clear any previous errors on successful calculation
      setDistanceError(null);
    } catch (error) {
      console.error('Distance calculation error:', error);
      setDistanceError('Unable to calculate distance. Please verify the addresses have valid coordinates.');
    } finally {
      setCalculatingDistance(false);
    }
  };

  // Validation helper function
  const validateField = (field: string, value: string | number) => {
    let error = '';
    
    switch (field) {
      case 'pickupAddress.contactName':
      case 'deliveryAddress.contactName': {
        const nameValidation = validateContactName(value as string);
        if (!nameValidation.isValid) {
          error = nameValidation.error || '';
        }
        break;
      }
      
      case 'pickupAddress.phone':
      case 'deliveryAddress.phone': {
        const phoneValidation = validatePhone(value as string);
        if (!phoneValidation.isValid) {
          error = phoneValidation.error || '';
        }
        break;
      }
      
      case 'pickupAddress.postalCode':
      case 'deliveryAddress.postalCode': {
        const postalValidation = validatePostalCode(value as string);
        if (!postalValidation.isValid) {
          error = postalValidation.error || '';
        }
        break;
      }
      
      case 'pickupAddress.city':
      case 'deliveryAddress.city': {
        const cityValidation = validateCity(value as string);
        if (!cityValidation.isValid) {
          error = cityValidation.error || '';
        }
        break;
      }
      
      case 'weight': {
        const weightValidation = validateWeight(value as number);
        if (!weightValidation.isValid) {
          error = weightValidation.error || '';
        }
        break;
      }
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleInputChange = useCallback((field: string, value: string | number | boolean | undefined | Record<string, unknown>) => {
    // Validate the field if it's a string or number
    if (typeof value === 'string' || typeof value === 'number') {
      validateField(field, value);
    }
    
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        const currentField = prev[keys[0] as keyof FormData];
        const updatedField = typeof currentField === 'object' && currentField !== null
          ? { ...currentField, [keys[1]]: value }
          : { [keys[1]]: value };
        
        return {
          ...prev,
          [keys[0]]: updatedField
        };
      }
      return prev;
    });
  }, []);

  const calculateEstimate = useCallback(() => {
    const baseRates = {
      standard: 250,
      express: 450,
      same_day: 750
    };
    
    const weight = formData.weight || 1;
    const weightMultiplier = weight > 5 ? 1.5 : 1;
    
    const baseCost = baseRates[formData.serviceType || 'standard'];
    const finalCost = Math.round(baseCost * weightMultiplier);
    setEstimatedCost(finalCost);
  }, [formData.weight, formData.serviceType]);

  const handleSubmitBooking = async () => {
    try {
      // Validate required fields first
      if (!formData.pickupAddress || !formData.deliveryAddress) {
        alert('Please complete both pickup and delivery addresses');
        return;
      }

      if (!formData.weight) {
        alert('Please specify the package weight');
        return;
      }

      if (!formData.packageType) {
        alert('Please select a package type');
        return;
      }

      if (!formData.pickupDate) {
        alert('Please select a pickup date');
        return;
      }

      // Validate pickup address
      const pickupAddress = formData.pickupAddress as AddressData;
      if (!pickupAddress.address || !pickupAddress.contactName || !pickupAddress.phone || 
          !pickupAddress.city || !pickupAddress.postalCode) {
        alert('Please complete all pickup address fields');
        return;
      }

      // Validate delivery address
      const deliveryAddress = formData.deliveryAddress as AddressData;
      if (!deliveryAddress.address || !deliveryAddress.contactName || !deliveryAddress.phone || 
          !deliveryAddress.city || !deliveryAddress.postalCode) {
        alert('Please complete all delivery address fields');
        return;
      }

      // Validate individual fields
      const pickupValidation = validateCompleteAddress(pickupAddress, 'pickup');
      const pickupErrors = pickupValidation.filter(result => !result.isValid);
      
      if (pickupErrors.length > 0) {
        alert(`Pickup address errors:\n${pickupErrors.map(e => e.error).join('\n')}`);
        return;
      }

      const deliveryValidation = validateCompleteAddress(deliveryAddress, 'delivery');
      const deliveryErrors = deliveryValidation.filter(result => !result.isValid);
      
      if (deliveryErrors.length > 0) {
        alert(`Delivery address errors:\n${deliveryErrors.map(e => e.error).join('\n')}`);
        return;
      }

      // Validate weight
      const weightValidation = validateWeight(formData.weight);
      if (!weightValidation.isValid) {
        alert(`Weight error: ${weightValidation.error}`);
        return;
      }

      // Format and clean the data for API submission
      const cleanedFormData = {
        ...formData,
        pickupAddress: {
          address: formatAddressForAPI(pickupAddress.address),
          contactName: formatContactNameForAPI(pickupAddress.contactName),
          phone: formatPhoneForAPI(pickupAddress.phone),
          city: formatCityForAPI(pickupAddress.city),
          postalCode: formatPostalCodeForAPI(pickupAddress.postalCode),
          instructions: pickupAddress.instructions?.trim() || undefined
        },
        deliveryAddress: {
          address: formatAddressForAPI(deliveryAddress.address),
          contactName: formatContactNameForAPI(deliveryAddress.contactName),
          phone: formatPhoneForAPI(deliveryAddress.phone),
          city: formatCityForAPI(deliveryAddress.city),
          postalCode: formatPostalCodeForAPI(deliveryAddress.postalCode),
          instructions: deliveryAddress.instructions?.trim() || undefined
        },
        specialInstructions: formData.specialInstructions?.trim() || undefined
      };

      await statelessBookingService.createBooking(cleanedFormData);
      
      // Reset form
      setFormData({
        pickupAddress: {},
        deliveryAddress: {},
        packageType: undefined,
        weight: undefined,
        serviceType: 'standard',
        pickupDate: undefined,
        specialInstructions: '',
        insurance: false,
        insuranceValue: undefined,
        distance: undefined
      });
      setCurrentStep(1);
      setDistanceError(null);
      
      alert('Booking created successfully!');
    } catch (error) {
      console.error('Booking creation failed:', error);
      alert(`Failed to create booking: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-transport-primary mb-2">Package & Route Details</h3>
              <p className="text-neutral-600">Tell us about your package and delivery locations</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <AddressSelector
                  label="Pickup Address"
                  placeholder="Enter pickup address"
                  value={formData.pickupAddress?.address || ''}
                  onChange={(value) => handleInputChange("pickupAddress.address", value)}
                  onAddressSelect={(address) => {
                    if (address) {
                      const updatedPickupAddress = {
                        address: address.street,
                        contactName: address.contactName,
                        phone: address.phone,
                        city: address.city,
                        postalCode: address.zipCode,
                        coordinates: address.coordinates,
                        formattedAddress: address.formattedAddress,
                        placeId: address.placeId
                      };
                      handleInputChange("pickupAddress", updatedPickupAddress);
                      
                      // Calculate distance if delivery address also has coordinates
                      if (formData.deliveryAddress?.coordinates && address.coordinates) {
                        calculateDistanceBetweenAddresses(
                          address.coordinates,
                          formData.deliveryAddress.coordinates
                        );
                      }
                    }
                  }}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickupContactName">Contact Name</Label>
                    <Input
                      id="pickupContactName"
                      placeholder="Contact person name"
                      value={formData.pickupAddress?.contactName || ''}
                      onChange={(e) => handleInputChange("pickupAddress.contactName", e.target.value)}
                      className={validationErrors['pickupAddress.contactName'] ? 'border-red-500' : ''}
                    />
                    {validationErrors['pickupAddress.contactName'] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors['pickupAddress.contactName']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="pickupPhone">Phone</Label>
                    <Input
                      id="pickupPhone"
                      placeholder="Contact phone number"
                      value={formData.pickupAddress?.phone || ''}
                      onChange={(e) => handleInputChange("pickupAddress.phone", e.target.value)}
                      className={validationErrors['pickupAddress.phone'] ? 'border-red-500' : ''}
                    />
                    {validationErrors['pickupAddress.phone'] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors['pickupAddress.phone']}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickupCity">City</Label>
                    <Input
                      id="pickupCity"
                      placeholder="City"
                      value={formData.pickupAddress?.city || ''}
                      onChange={(e) => handleInputChange("pickupAddress.city", e.target.value)}
                      className={validationErrors['pickupAddress.city'] ? 'border-red-500' : ''}
                    />
                    {validationErrors['pickupAddress.city'] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors['pickupAddress.city']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="pickupPostalCode">Postal Code</Label>
                    <Input
                      id="pickupPostalCode"
                      placeholder="Postal code"
                      value={formData.pickupAddress?.postalCode || ''}
                      onChange={(e) => handleInputChange("pickupAddress.postalCode", e.target.value)}
                      className={validationErrors['pickupAddress.postalCode'] ? 'border-red-500' : ''}
                    />
                    {validationErrors['pickupAddress.postalCode'] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors['pickupAddress.postalCode']}</p>
                    )}
                  </div>
                </div>
                
                <AddressSelector
                  label="Delivery Address"
                  placeholder="Enter delivery address"
                  value={formData.deliveryAddress?.address || ''}
                  onChange={(value) => handleInputChange("deliveryAddress.address", value)}
                  onAddressSelect={(address) => {
                    if (address) {
                      const updatedDeliveryAddress = {
                        address: address.street,
                        contactName: address.contactName,
                        phone: address.phone,
                        city: address.city,
                        postalCode: address.zipCode,
                        coordinates: address.coordinates,
                        formattedAddress: address.formattedAddress,
                        placeId: address.placeId
                      };
                      handleInputChange("deliveryAddress", updatedDeliveryAddress);
                      
                      // Calculate distance if pickup address also has coordinates
                      if (formData.pickupAddress?.coordinates && address.coordinates) {
                        calculateDistanceBetweenAddresses(
                          formData.pickupAddress.coordinates,
                          address.coordinates
                        );
                      }
                    }
                  }}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryContactName">Contact Name</Label>
                    <Input
                      id="deliveryContactName"
                      placeholder="Contact person name"
                      value={formData.deliveryAddress?.contactName || ''}
                      onChange={(e) => handleInputChange("deliveryAddress.contactName", e.target.value)}
                      className={validationErrors['deliveryAddress.contactName'] ? 'border-red-500' : ''}
                    />
                    {validationErrors['deliveryAddress.contactName'] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors['deliveryAddress.contactName']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="deliveryPhone">Phone</Label>
                    <Input
                      id="deliveryPhone"
                      placeholder="Contact phone number"
                      value={formData.deliveryAddress?.phone || ''}
                      onChange={(e) => handleInputChange("deliveryAddress.phone", e.target.value)}
                      className={validationErrors['deliveryAddress.phone'] ? 'border-red-500' : ''}
                    />
                    {validationErrors['deliveryAddress.phone'] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors['deliveryAddress.phone']}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryCity">City</Label>
                    <Input
                      id="deliveryCity"
                      placeholder="City"
                      value={formData.deliveryAddress?.city || ''}
                      onChange={(e) => handleInputChange("deliveryAddress.city", e.target.value)}
                      className={validationErrors['deliveryAddress.city'] ? 'border-red-500' : ''}
                    />
                    {validationErrors['deliveryAddress.city'] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors['deliveryAddress.city']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="deliveryPostalCode">Postal Code</Label>
                    <Input
                      id="deliveryPostalCode"
                      placeholder="Postal code"
                      value={formData.deliveryAddress?.postalCode || ''}
                      onChange={(e) => handleInputChange("deliveryAddress.postalCode", e.target.value)}
                      className={validationErrors['deliveryAddress.postalCode'] ? 'border-red-500' : ''}
                    />
                    {validationErrors['deliveryAddress.postalCode'] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors['deliveryAddress.postalCode']}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="packageType">Package Type</Label>
                  <select
                    id="packageType"
                    value={formData.packageType || ''}
                    onChange={(e) => handleInputChange("packageType", e.target.value as FormData['packageType'])}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">Select package type</option>
                    <option value="document">Documents</option>
                    <option value="package">General Package</option>
                    <option value="fragile">Fragile Items</option>
                    <option value="bulk">Bulk Items</option>
                  </select>
                </div>

                {/* Distance Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Route className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-medium text-gray-900">Distance</Label>
                  </div>
                  
                  {calculatingDistance ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Calculating distance...</span>
                    </div>
                  ) : formData.distance ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Distance:</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formData.distance.formattedDistance}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <span>Routing Method:</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              formData.distance.method === 'google_maps_truck' 
                                ? 'border-green-500 text-green-700 bg-green-50' 
                                : formData.distance.method === 'google_maps'
                                ? 'border-blue-500 text-blue-700 bg-blue-50'
                                : 'border-gray-500 text-gray-700 bg-gray-50'
                            }`}
                          >
                            {getTruckRoutingInfo(formData.distance).routingType}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {getTruckRoutingInfo(formData.distance).adjustmentInfo}
                        </div>
                        {formData.distance.method === 'google_maps_truck' && (
                          <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            <span>Optimized for commercial vehicles</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : distanceError ? (
                    <div className="text-sm text-red-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {distanceError}
                    </div>
                  ) : formData.pickupAddress?.address && formData.deliveryAddress?.address ? (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Select addresses with coordinates to calculate distance
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Complete pickup and delivery addresses to see distance
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="0.0"
                      value={formData.weight || ''}
                      onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || undefined)}
                      className={validationErrors['weight'] ? 'border-red-500' : ''}
                    />
                    {validationErrors['weight'] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors['weight']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="pickupDate">Pickup Date</Label>
                    <Input
                      id="pickupDate"
                      type="date"
                      value={formData.pickupDate || ''}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleInputChange("pickupDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center pt-4">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!formData.pickupAddress?.address || !formData.deliveryAddress?.address}
                className="bg-transport-primary hover:bg-transport-primary/90"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-transport-primary mb-2">Select Service Type</h3>
              <p className="text-neutral-600">Choose the delivery option that suits your needs</p>
            </div>

            <div className="grid gap-4">
              {serviceTypes.map((service) => {
                const Icon = service.icon;
                return (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all ${
                      formData.serviceType === service.id
                        ? 'ring-2 ring-transport-primary border-transport-primary'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleInputChange("serviceType", service.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="h-6 w-6 text-transport-primary" />
                            <div>
                              <h4 className="font-semibold text-lg">{service.name}</h4>
                              <p className="text-sm text-neutral-600">{service.duration}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {service.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-transport-primary">{service.price}</div>
                          <div className="text-sm text-neutral-600">starting from</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-neutral-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-transport-primary" />
                  <Label className="text-base font-medium">Insurance Options</Label>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="insurance"
                      checked={formData.insurance || false}
                      onChange={(e) => handleInputChange("insurance", e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="insurance">Add insurance coverage</Label>
                  </div>
                  {formData.insurance && (
                    <div>
                      <Label htmlFor="insuranceValue">Declared Value (₹)</Label>
                      <Input
                        id="insuranceValue"
                        type="number"
                        placeholder="Enter package value"
                        value={formData.insuranceValue || ''}
                        onChange={(e) => handleInputChange("insuranceValue", parseFloat(e.target.value) || undefined)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
              <Textarea
                id="specialInstructions"
                placeholder="Any special handling instructions..."
                value={formData.specialInstructions || ''}
                onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  calculateEstimate();
                  setCurrentStep(3);
                }}
                className="bg-transport-primary hover:bg-transport-primary/90"
              >
                Get Quote <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-transport-primary mb-2">Booking Summary</h3>
              <p className="text-neutral-600">Review your booking details before confirming</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Pickup Details</h4>
                    <div className="text-sm text-neutral-600 space-y-1">
                      <p>{formData.pickupAddress?.address}</p>
                      <p>Contact: {formData.pickupAddress?.contactName}</p>
                      <p>Phone: {formData.pickupAddress?.phone}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Delivery Details</h4>
                    <div className="text-sm text-neutral-600 space-y-1">
                      <p>{formData.deliveryAddress?.address}</p>
                      <p>Contact: {formData.deliveryAddress?.contactName}</p>
                      <p>Phone: {formData.deliveryAddress?.phone}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Package Type</h4>
                    <p className="text-sm text-neutral-600 capitalize">{formData.packageType}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Weight</h4>
                    <p className="text-sm text-neutral-600">{formData.weight} kg</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium mb-1">Service Type</h4>
                    <p className="text-sm text-neutral-600 capitalize">
                      {serviceTypes.find(s => s.id === formData.serviceType)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-medium mb-1">Estimated Cost</h4>
                    <p className="text-2xl font-bold text-transport-primary">₹{estimatedCost}</p>
                  </div>
                </div>

                {formData.insurance && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-1">Insurance</h4>
                      <p className="text-sm text-neutral-600">
                        Declared value: ₹{formData.insuranceValue}
                      </p>
                    </div>
                  </>
                )}

                {formData.specialInstructions && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-1">Special Instructions</h4>
                      <p className="text-sm text-neutral-600">{formData.specialInstructions}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitBooking}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Booking
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium ${
                step === currentStep
                  ? 'bg-transport-primary text-white border-transport-primary'
                  : step < currentStep
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-neutral-400 border-neutral-200'
              }`}
            >
              {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-20 h-0.5 ml-4 ${
                  step < currentStep ? 'bg-green-500' : 'bg-neutral-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Draft Info */}
    </div>
  );
};

export default NewBooking;
