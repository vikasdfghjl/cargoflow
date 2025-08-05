/**
 * Frontend validation utilities to match backend validation requirements
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all spaces and special characters except + and numbers
  const cleanPhone = phone.replace(/[\s\-()./]/g, '');
  
  // Check for valid mobile phone format (supports international formats)
  // Should start with + or digit, then have 6-15 digits
  const phoneRegex = /^[+]?[1-9][\d]{5,14}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return { 
      isValid: false, 
      error: 'Please provide a valid phone number (e.g., +91 98765 43210 or 9876543210)' 
    };
  }

  return { isValid: true };
};

export const validateContactName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Contact name is required' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return { 
      isValid: false, 
      error: 'Contact name must be between 2 and 100 characters' 
    };
  }

  // Only letters and spaces allowed
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { 
      isValid: false, 
      error: 'Contact name can only contain letters and spaces' 
    };
  }

  return { isValid: true };
};

export const validatePostalCode = (postalCode: string): ValidationResult => {
  if (!postalCode || !postalCode.trim()) {
    return { isValid: false, error: 'Postal code is required' };
  }

  const cleanPostalCode = postalCode.replace(/\s/g, '');
  
  // Must be exactly 6 digits for Indian postal codes
  const postalCodeRegex = /^[0-9]{6}$/;
  if (!postalCodeRegex.test(cleanPostalCode)) {
    return { 
      isValid: false, 
      error: 'Postal code must be exactly 6 digits (e.g., 110001)' 
    };
  }

  return { isValid: true };
};

export const validateCity = (city: string): ValidationResult => {
  if (!city || !city.trim()) {
    return { isValid: false, error: 'City is required' };
  }

  const trimmedCity = city.trim();
  
  if (trimmedCity.length < 2 || trimmedCity.length > 50) {
    return { 
      isValid: false, 
      error: 'City name must be between 2 and 50 characters' 
    };
  }

  // Only letters and spaces allowed
  const cityRegex = /^[a-zA-Z\s]+$/;
  if (!cityRegex.test(trimmedCity)) {
    return { 
      isValid: false, 
      error: 'City name can only contain letters and spaces' 
    };
  }

  return { isValid: true };
};

export const validateAddress = (address: string): ValidationResult => {
  if (!address || !address.trim()) {
    return { isValid: false, error: 'Address is required' };
  }

  const trimmedAddress = address.trim();
  
  if (trimmedAddress.length < 5 || trimmedAddress.length > 200) {
    return { 
      isValid: false, 
      error: 'Address must be between 5 and 200 characters' 
    };
  }

  return { isValid: true };
};

export const validateWeight = (weight: number | string): ValidationResult => {
  const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
  
  if (isNaN(weightNum) || weightNum <= 0) {
    return { isValid: false, error: 'Weight must be a positive number' };
  }

  if (weightNum < 0.1 || weightNum > 1000) {
    return { 
      isValid: false, 
      error: 'Weight must be between 0.1 and 1000 kg' 
    };
  }

  return { isValid: true };
};

// Format phone number for display
export const formatPhoneForDisplay = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-()./]/g, '');
  
  // Format Indian mobile numbers: +91 98765 43210
  if (cleanPhone.startsWith('+91') && cleanPhone.length === 13) {
    return `+91 ${cleanPhone.slice(3, 8)} ${cleanPhone.slice(8)}`;
  }
  
  // Format 10-digit Indian numbers: 98765 43210
  if (cleanPhone.length === 10 && cleanPhone.match(/^[6-9]/)) {
    return `${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  }
  
  return phone; // Return as-is if format not recognized
};

// Clean phone number for API submission
export const formatPhoneForAPI = (phone: string): string => {
  return phone.replace(/[\s\-()./]/g, '');
};

// Clean contact name for API submission
export const formatContactNameForAPI = (name: string): string => {
  return name.trim().replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

// Clean postal code for API submission
export const formatPostalCodeForAPI = (postalCode: string): string => {
  return postalCode.replace(/\s/g, '');
};

// Clean city name for API submission
export const formatCityForAPI = (city: string): string => {
  return city.trim().replace(/\s+/g, ' ');
};

// Clean address for API submission
export const formatAddressForAPI = (address: string): string => {
  return address.trim().replace(/\s+/g, ' ');
};

// Validate complete address object
export interface AddressData {
  address: string;
  contactName: string;
  phone: string;
  city: string;
  postalCode: string;
  instructions?: string;
}

export const validateCompleteAddress = (addressData: AddressData, type: 'pickup' | 'delivery'): ValidationResult[] => {
  const results: ValidationResult[] = [];
  
  results.push({
    ...validateAddress(addressData.address),
    ...(validateAddress(addressData.address).error && { 
      error: `${type} ${validateAddress(addressData.address).error?.toLowerCase()}` 
    })
  });
  
  results.push({
    ...validateContactName(addressData.contactName),
    ...(validateContactName(addressData.contactName).error && { 
      error: `${type} ${validateContactName(addressData.contactName).error?.toLowerCase()}` 
    })
  });
  
  results.push({
    ...validatePhone(addressData.phone),
    ...(validatePhone(addressData.phone).error && { 
      error: `${type} ${validatePhone(addressData.phone).error?.toLowerCase()}` 
    })
  });
  
  results.push({
    ...validateCity(addressData.city),
    ...(validateCity(addressData.city).error && { 
      error: `${type} ${validateCity(addressData.city).error?.toLowerCase()}` 
    })
  });
  
  results.push({
    ...validatePostalCode(addressData.postalCode),
    ...(validatePostalCode(addressData.postalCode).error && { 
      error: `${type} ${validatePostalCode(addressData.postalCode).error?.toLowerCase()}` 
    })
  });
  
  return results;
};
