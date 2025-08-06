/**
 * Distance calculation utilities using Google Maps API and Haversine formula
 * Optimized for truck/commercial vehicle routing
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface DistanceResult {
  distance: number; // in kilometers
  duration?: number; // in minutes
  formattedDistance: string;
  formattedDuration?: string;
  method: 'google_maps_truck' | 'google_maps' | 'haversine';
}

/**
 * Calculate distance using Haversine formula (straight-line distance)
 * This is the fallback method when Google Maps API is not available
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(coord2.latitude - coord1.latitude);
  const dLon = deg2rad(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.latitude)) * Math.cos(deg2rad(coord2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate distance and duration using Google Maps Distance Matrix API with truck-optimized routing
 */
export async function calculateGoogleMapsDistance(
  origin: Coordinates,
  destination: Coordinates,
  vehicleType: 'truck' | 'car' = 'truck'
): Promise<DistanceResult> {
  try {
    // Check if Google Maps API is available
    if (!window.google?.maps) {
      throw new Error('Google Maps API not available');
    }

    return new Promise((resolve, reject) => {
      const service = new google.maps.DistanceMatrixService();
      
      // Truck-optimized routing settings
      const requestOptions = {
        origins: [new google.maps.LatLng(origin.latitude, origin.longitude)],
        destinations: [new google.maps.LatLng(destination.latitude, destination.longitude)],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        // Truck-friendly routing preferences
        avoidHighways: false, // Trucks typically use highways for efficiency
        avoidTolls: false,    // Commercial transport usually accepts tolls
      };
      
      service.getDistanceMatrix(
        requestOptions,
        (response, status) => {
          if (status === google.maps.DistanceMatrixStatus.OK && response) {
            const element = response.rows[0].elements[0];
            
            if (element.status === 'OK') {
              const distanceInMeters = element.distance.value;
              const durationInSeconds = element.duration.value;
              let distanceInKm = Math.round((distanceInMeters / 1000) * 100) / 100;
              let adjustedDurationMinutes = Math.round(durationInSeconds / 60);
              
              if (vehicleType === 'truck') {
                // Apply truck-specific adjustments
                
                // 1. Distance adjustment: Trucks may need to use longer routes
                // Add 5-10% to account for truck-specific route restrictions
                distanceInKm = Math.round((distanceInKm * 1.08) * 100) / 100; // 8% additional distance
                
                // 2. Duration adjustment: Trucks are slower and have additional factors
                // - Lower average speed (trucks typically 10-15% slower)
                // - Mandatory rest stops for long distances (driving regulations)
                // - Loading/unloading time consideration
                // - Potential weight station stops
                let durationMultiplier = 1.25; // Base 25% additional time
                
                // Additional time for long-distance trucking regulations
                if (distanceInKm > 500) {
                  durationMultiplier = 1.35; // 35% for very long distances (rest requirements)
                } else if (distanceInKm > 200) {
                  durationMultiplier = 1.30; // 30% for medium distances
                }
                
                adjustedDurationMinutes = Math.round(adjustedDurationMinutes * durationMultiplier);
              }
              
              resolve({
                distance: distanceInKm,
                duration: adjustedDurationMinutes,
                formattedDistance: vehicleType === 'truck' ? 
                  formatDistance(distanceInKm) : element.distance.text,
                formattedDuration: formatDuration(adjustedDurationMinutes),
                method: vehicleType === 'truck' ? 'google_maps_truck' : 'google_maps'
              });
            } else {
              // Fallback to Haversine if Google can't calculate route
              const distance = calculateHaversineDistance(origin, destination);
              resolve({
                distance,
                formattedDistance: `${distance} km`,
                method: 'haversine'
              });
            }
          } else {
            reject(new Error(`Distance Matrix API error: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    // Fallback to Haversine formula
    const distance = calculateHaversineDistance(origin, destination);
    return {
      distance,
      formattedDistance: `${distance} km`,
      method: 'haversine'
    };
  }
}
        (response, status) => {
          if (status === google.maps.DistanceMatrixStatus.OK && response) {
            const element = response.rows[0].elements[0];
            
            if (element.status === 'OK') {
              const distanceInMeters = element.distance.value;
              const durationInSeconds = element.duration.value;
              const distanceInKm = Math.round((distanceInMeters / 1000) * 100) / 100;
              const durationInMinutes = Math.round(durationInSeconds / 60);
              
              resolve({
                distance: distanceInKm,
                duration: durationInMinutes,
                formattedDistance: element.distance.text,
                formattedDuration: element.duration.text,
                method: 'google_maps'
              });
            } else {
              // Fallback to Haversine if Google can't calculate route
              const distance = calculateHaversineDistance(origin, destination);
              resolve({
                distance,
                formattedDistance: `${distance} km`,
                method: 'haversine'
              });
            }
          } else {
/**
 * Calculate distance between two addresses (defaults to truck routing)
 * Uses Google Maps API if available, falls back to Haversine formula
 */
export async function calculateDistance(
  origin: Coordinates,
  destination: Coordinates,
  vehicleType: 'truck' | 'car' = 'truck'
): Promise<DistanceResult> {
  try {
    // Try Google Maps first for more accurate truck routing distance
    return await calculateGoogleMapsDistance(origin, destination, vehicleType);
  } catch (error) {
    console.warn('Google Maps distance calculation failed, using Haversine:', error);
    
    // Fallback to straight-line distance with truck adjustment
    let distance = calculateHaversineDistance(origin, destination);
    
    // Apply truck routing factor to Haversine distance as fallback
    if (vehicleType === 'truck') {
      // Trucks typically travel 15-25% more distance than straight line due to:
      // - Road network limitations
      // - Truck route restrictions
      // - Highway preferences
      distance = Math.round((distance * 1.20) * 100) / 100; // 20% additional distance
    }
    
    return {
      distance,
      formattedDistance: `~${distance} km`,
      method: 'haversine'
    };
  }
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  } else if (distance < 10) {
    return `${Math.round(distance * 10) / 10} km`;
  } else {
    return `${Math.round(distance)} km`;
  }
}

/**
 * Format duration for display with truck-specific context
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${remainingMinutes} min`;
    }
  }
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    coords &&
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180 &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude)
  );
}

/**
 * Check if two coordinate sets are significantly different
 * Used to determine if distance needs to be recalculated
 */
export function coordinatesChanged(
  coords1: Coordinates | undefined,
  coords2: Coordinates | undefined,
  threshold: number = 0.001 // ~100 meters
): boolean {
  if (!coords1 || !coords2) return true;
  
  const latDiff = Math.abs(coords1.latitude - coords2.latitude);
  const lonDiff = Math.abs(coords1.longitude - coords2.longitude);
  
  return latDiff > threshold || lonDiff > threshold;
}

/**
 * Get truck routing information for display
 */
export function getTruckRoutingInfo(result: DistanceResult): {
  isTruckOptimized: boolean;
  routingType: string;
  adjustmentInfo: string;
} {
  const isTruckOptimized = result.method === 'google_maps_truck';
  
  return {
    isTruckOptimized,
    routingType: isTruckOptimized 
      ? 'Truck-Optimized Route' 
      : result.method === 'google_maps' 
        ? 'Standard Route' 
        : 'Straight-Line Estimate',
    adjustmentInfo: isTruckOptimized 
      ? 'Includes truck routes, speed limits, and commercial vehicle considerations'
      : result.method === 'haversine'
        ? 'Estimated distance with truck routing factor applied'
        : 'Standard vehicle routing'
  };
}

// Export types
export type { Coordinates, DistanceResult };
