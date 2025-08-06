import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Search, 
  Loader2, 
  Navigation, 
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw
} from 'lucide-react';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; // New Delhi, India

export interface LocationData {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  formattedAddress: string;
  placeId?: string;
  addressComponents?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  className?: string;
  title?: string;
  description?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  onLocationSelect, 
  initialLocation, 
  className = '',
  title = "Select Pickup Location",
  description = "Search for an address or click on the map to select your location"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocompleteElement, setAutocompleteElement] = useState<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Manual coordinate entry states
  const [showCoordinateInput, setShowCoordinateInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  
  // Cost optimization: Use refs for debouncing to avoid dependency issues
  const reverseGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastReverseGeocodeCallRef = useRef<number>(0);

  const parseAddressComponents = useCallback((components: google.maps.GeocoderAddressComponent[]) => {
    const addressComponents: LocationData['addressComponents'] = {};

    components.forEach((component) => {
      const types = component.types;
      
      if (types.includes('street_number') || types.includes('route')) {
        addressComponents.street = addressComponents.street 
          ? `${component.long_name} ${addressComponents.street}`
          : component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        addressComponents.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressComponents.state = component.long_name;
      } else if (types.includes('postal_code')) {
        addressComponents.zipCode = component.long_name;
      } else if (types.includes('country')) {
        addressComponents.country = component.long_name;
      }
    });

    return addressComponents;
  }, []);

  // Use refs to store stable references to callback functions
  const onLocationSelectRef = useRef(onLocationSelect);
  const parseAddressComponentsRef = useRef(parseAddressComponents);

  // Update refs when props/functions change
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
    parseAddressComponentsRef.current = parseAddressComponents;
  }, [onLocationSelect, parseAddressComponents]);

  // Create stable callback functions that don't cause useEffect to re-run
  // COST OPTIMIZATION: Debounced reverse geocoding to reduce API calls
  const reverseGeocode = useCallback((lat: number, lng: number, immediate: boolean = false) => {
    // Rate limiting: Don't make calls more than once every 500ms
    const now = Date.now();
    const timeSinceLastCall = now - lastReverseGeocodeCallRef.current;
    
    if (!immediate && timeSinceLastCall < 500) {
      // Clear previous timeout
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
      }
      
      // Set new timeout for delayed execution
      const timeout = setTimeout(() => {
        reverseGeocode(lat, lng, true);
      }, 500 - timeSinceLastCall);
      
      reverseGeocodeTimeoutRef.current = timeout;
      return;
    }
    
    lastReverseGeocodeCallRef.current = now;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const result = results[0];
        const addressComponents = parseAddressComponentsRef.current(result.address_components || []);

        const locationData: LocationData = {
          coordinates: { latitude: lat, longitude: lng },
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
          addressComponents
        };

        setSelectedLocation(locationData);
        setSearchValue(result.formatted_address);
        onLocationSelectRef.current(locationData);
      }
    });
  }, []); // No dependencies - stable function

  // Define handlePlaceSelect as a stable function without dependencies
  const handlePlaceSelectRef = useRef<((place: google.maps.places.PlaceResult) => void) | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.');
      setIsLoading(false);
      return;
    }

    let mounted = true; // Flag to prevent state updates if component unmounts

    // Create a stable reverseGeocode function for this effect
    const reverseGeocodeLocal = (lat: number, lng: number) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (!mounted) return; // Don't update state if component unmounted
        
        if (status === 'OK' && results?.[0]) {
          const result = results[0];
          const addressComponents = parseAddressComponentsRef.current(result.address_components || []);

          const locationData: LocationData = {
            coordinates: { latitude: lat, longitude: lng },
            formattedAddress: result.formatted_address,
            placeId: result.place_id,
            addressComponents
          };

          setSelectedLocation(locationData);
          setSearchValue(result.formatted_address);
          onLocationSelectRef.current(locationData);
        }
      });
    };

    // Define initializeMap inside useEffect to avoid dependency issues
    const initializeMapInternal = () => {
      if (!mapRef.current) {
        console.warn('Map container not ready');
        return;
      }

      // Ensure the container has dimensions
      const container = mapRef.current;
      if (!container.offsetWidth || !container.offsetHeight) {
        console.warn('Map container has no dimensions, retrying...');
        setTimeout(() => {
          if (mounted) initializeMapInternal();
        }, 100);
        return;
      }

      try {
        const initialCenter = initialLocation?.coordinates 
          ? { lat: initialLocation.coordinates.latitude, lng: initialLocation.coordinates.longitude }
          : DEFAULT_CENTER;

        // Create map with cost-optimized configuration
        const mapInstance = new google.maps.Map(container, {
          center: initialCenter,
          zoom: initialLocation ? 16 : 12,
          // COST OPTIMIZATION: Disable expensive controls that aren't essential
          mapTypeControl: false,        // Saves on satellite/terrain tile requests
          streetViewControl: false,     // Saves on street view API costs
          fullscreenControl: true,      // Keep essential controls
          zoomControl: true,
          gestureHandling: 'cooperative',
          // COST OPTIMIZATION: Restrict map types to standard roadmap only
          mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP]
          },
          // COST OPTIMIZATION: Limit zoom levels to reduce tile requests
          minZoom: 8,
          maxZoom: 18
        });

        // Wait for map to be fully initialized
        google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
          if (!mounted) return; // Don't proceed if component unmounted
          
          console.log('Map fully loaded and ready');
          setMap(mapInstance);

          // Create marker after map is ready
          const markerInstance = new google.maps.Marker({
            position: initialCenter,
            map: mapInstance,
            draggable: true,
            title: 'Selected Location'
          });

          setMarker(markerInstance);

          // Create a handlePlaceSelect function for this map instance
          const handlePlaceSelectForThisMap = (place: google.maps.places.PlaceResult) => {
            if (!place.geometry?.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            // Update map and marker
            mapInstance.setCenter({ lat, lng });
            mapInstance.setZoom(16);
            markerInstance.setPosition({ lat, lng });

            // Parse address components
            const addressComponents = parseAddressComponentsRef.current(place.address_components || []);

            const locationData: LocationData = {
              coordinates: { latitude: lat, longitude: lng },
              formattedAddress: place.formatted_address || '',
              placeId: place.place_id,
              addressComponents
            };

            setSelectedLocation(locationData);
            setSearchValue(place.formatted_address || '');
            onLocationSelectRef.current(locationData);
          };

          // Store the function in ref for potential external use
          handlePlaceSelectRef.current = handlePlaceSelectForThisMap;

          // Set up autocomplete with cost optimization
          if (searchInputRef.current) {
            try {
              console.log('Setting up Google Places Autocomplete');
              const legacyAutocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
                // COST OPTIMIZATION: Restrict to addresses only (cheaper than all place types)
                types: ['address'],
                // COST OPTIMIZATION: Restrict to specific country to reduce search scope
                componentRestrictions: { country: 'in' },
                // COST OPTIMIZATION: Request only essential fields to reduce cost per request
                fields: ['place_id', 'formatted_address', 'geometry.location'],
                // COST OPTIMIZATION: Set bounds to limit search area (reduces API costs)
                bounds: mapInstance.getBounds() || undefined,
                strictBounds: true
              });

              setAutocompleteElement(legacyAutocomplete);

              // Listen for place selection
              legacyAutocomplete.addListener('place_changed', () => {
                const place = legacyAutocomplete.getPlace();
                if (place.geometry?.location && mounted) {
                  // COST OPTIMIZATION: For autocomplete results, use provided data instead of reverse geocoding
                  const locationData: LocationData = {
                    coordinates: { 
                      latitude: place.geometry.location.lat(), 
                      longitude: place.geometry.location.lng() 
                    },
                    formattedAddress: place.formatted_address || '',
                    placeId: place.place_id,
                    // Note: We skip parsing address components to avoid additional API calls
                    // They can be added later if needed for the specific use case
                    addressComponents: undefined
                  };
                  
                  setSelectedLocation(locationData);
                  setSearchValue(place.formatted_address || '');
                  onLocationSelectRef.current(locationData);
                  
                  // Update map without additional API calls
                  const lat = place.geometry.location.lat();
                  const lng = place.geometry.location.lng();
                  mapInstance.setCenter({ lat, lng });
                  mapInstance.setZoom(16);
                  markerInstance.setPosition({ lat, lng });
                }
              });
            } catch (autocompleteError) {
              console.warn('Error setting up autocomplete:', autocompleteError);
            }
          }

          // Handle map clicks
          mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng && mounted) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              
              markerInstance.setPosition({ lat, lng });
              mapInstance.panTo({ lat, lng });
              
              // Reverse geocode to get address
              reverseGeocodeLocal(lat, lng);
            }
          });

          // Handle marker drag
          markerInstance.addListener('dragend', () => {
            if (!mounted) return;
            const position = markerInstance.getPosition();
            if (position) {
              const lat = position.lat();
              const lng = position.lng();
              reverseGeocodeLocal(lat, lng);
            }
          });

          // If initial location exists, set search value
          if (initialLocation && mounted) {
            setSearchValue(initialLocation.formattedAddress);
          }

          if (mounted) {
            setIsLoading(false);
          }
        });

      } catch (error) {
        if (!mounted) return;
        console.error('Error initializing map:', error);
        setError('Failed to initialize the map. Please try again.');
        setIsLoading(false);
      }
    };

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    loader.load().then(() => {
      if (!mounted) return; // Don't initialize if component is unmounted
      
      // Small delay to ensure DOM is fully ready
      setTimeout(() => {
        if (mounted) {
          initializeMapInternal();
        }
      }, 100);
    }).catch((error) => {
      if (!mounted) return;
      console.error('Error loading Google Maps:', error);
      setError('Failed to load Google Maps. Please check your internet connection and API key.');
      setIsLoading(false);
    });

    // Cleanup function
    return () => {
      mounted = false; // Prevent state updates after cleanup
      
      // COST OPTIMIZATION: Clean up timeouts to prevent unnecessary API calls
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
        reverseGeocodeTimeoutRef.current = null;
      }
    };
  }, [initialLocation]); // Only depend on initialLocation - reverseGeocode is stable with refs

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (map && marker) {
          map.setCenter({ lat, lng });
          map.setZoom(16);
          marker.setPosition({ lat, lng });
          // COST OPTIMIZATION: Only reverse geocode on user request, not automatically
          reverseGeocode(lat, lng);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please search for your address or click on the map.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // COST OPTIMIZATION: Manual coordinate entry without API calls
  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180)');
      return;
    }
    
    const locationData: LocationData = {
      coordinates: { latitude: lat, longitude: lng },
      formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, // Simple coordinate display
      placeId: undefined,
      addressComponents: undefined
    };
    
    setSelectedLocation(locationData);
    setSearchValue(locationData.formattedAddress);
    onLocationSelectRef.current(locationData);
    
    if (map && marker) {
      map.setCenter({ lat, lng });
      map.setZoom(16);
      marker.setPosition({ lat, lng });
    }
    
    setShowCoordinateInput(false);
    setManualLat('');
    setManualLng('');
    setError(null);
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Google Maps integration requires an API key. Please configure VITE_GOOGLE_MAPS_API_KEY in your environment variables.
        </AlertDescription>
      </Alert>
    );
  }

  const clearError = () => setError(null);
  const resetLocation = () => {
    setSelectedLocation(null);
    setSearchValue('');
    setError(null);
    if (map && marker) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(12);
      marker.setPosition(DEFAULT_CENTER);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {selectedLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetLocation}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>
      
      <p className="text-sm text-gray-600">{description}</p>

      {/* Search Section */}
      <div className="space-y-3">
        <Label htmlFor="location-search" className="text-sm font-medium text-gray-700">
          Search for Location
        </Label>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
            <Input
              ref={searchInputRef}
              id="location-search"
              type="text"
              placeholder="Enter address, landmark, or location..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isLoading || isLocating}
            className="px-4 h-11 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
            title="Use my current location"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="px-4 h-11 border-gray-200 hover:bg-gray-50"
            title="Advanced options"
          >
            <Target className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Advanced Options Panel */}
      {showAdvancedOptions && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Advanced Options</span>
          </div>
          
          <div className="space-y-3">
            <Button
              type="button"
              variant={showCoordinateInput ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowCoordinateInput(!showCoordinateInput)}
              className="w-full justify-start"
            >
              <MapPin className="h-3 w-3 mr-2" />
              Enter Coordinates Manually
            </Button>
            
            {/* Manual Coordinate Input */}
            {showCoordinateInput && (
              <div className="p-4 border border-blue-200 rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Enter Coordinates</span>
                  <Badge variant="secondary" className="text-xs">No API cost</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Latitude</Label>
                    <Input
                      type="number"
                      placeholder="28.613900"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      className="text-sm mt-1"
                      step="0.000001"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Longitude</Label>
                    <Input
                      type="number"
                      placeholder="77.209000"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      className="text-sm mt-1"
                      step="0.000001"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleManualCoordinates}
                  size="sm"
                  className="mt-3 w-full"
                >
                  Set Location
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 flex items-center justify-between">
            <span className="flex-1 pr-2">{error}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-800 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Map Section */}
      <div className="relative rounded-lg overflow-hidden border border-gray-200">
        <div 
          ref={mapRef} 
          className="w-full bg-gray-100 h-64 min-h-[16rem]"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg shadow-sm border max-w-xs mx-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">Loading Map...</div>
                <div className="text-xs text-gray-500 mt-1">Please wait while we initialize Google Maps</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Map overlay instructions */}
        {!isLoading && !selectedLocation && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>Click on the map or search above to select a location</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="border border-green-200 bg-green-50/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-sm font-medium text-green-900">Location Selected</h4>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  Confirmed
                </Badge>
              </div>
              <p className="text-sm text-green-800 mb-2 leading-relaxed break-words">
                {selectedLocation.formattedAddress}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-green-700">
                <div>
                  <span className="font-medium">Latitude:</span>
                  <span className="ml-1 font-mono">{selectedLocation.coordinates.latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="font-medium">Longitude:</span>
                  <span className="ml-1 font-mono">{selectedLocation.coordinates.longitude.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Helper Text */}
      <div className="text-xs text-gray-500 text-center space-y-1 pt-2 border-t border-gray-100">
        <p>💡 <strong>Tip:</strong> You can drag the map marker to fine-tune your location</p>
        <p>📍 Accurate location helps us provide better service estimates</p>
      </div>
    </div>
  );
};

export default LocationPicker;
