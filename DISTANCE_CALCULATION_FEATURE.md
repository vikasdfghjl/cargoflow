# Distance Calculation Feature

## Overview
This feature automatically calculates the distance between pickup and delivery addresses when a customer creates a new booking. The distance is calculated using Google Maps API when available, with a fallback to the Haversine formula for straight-line distance calculations.

## Implementation Details

### New Components and Utilities

#### 1. Distance Calculation Utility (`src/utils/distanceCalculation.ts`)
- **Primary Function**: `calculateDistance(origin, destination)` - Main function that tries Google Maps API first, then falls back to Haversine
- **Google Maps Integration**: `calculateGoogleMapsDistance()` - Uses Google Maps Distance Matrix API for accurate routing distance and duration
- **Fallback Method**: `calculateHaversineDistance()` - Calculates straight-line distance using the Haversine formula
- **Helper Functions**: 
  - `formatDistance()` - Formats distance for display (m/km)
  - `formatDuration()` - Formats duration for display (min/hr)
  - `isValidCoordinates()` - Validates coordinate data
  - `coordinatesChanged()` - Checks if recalculation is needed

#### 2. Updated NewBooking Component
- **Enhanced Form Data**: Added distance field to store `DistanceResult`
- **Real-time Calculation**: Automatically calculates distance when both pickup and delivery addresses have coordinates
- **Loading States**: Shows calculating spinner during distance computation
- **Error Handling**: Displays fallback messages when calculation fails

#### 3. Updated AddressSelector Component
- **Coordinate Support**: Now includes coordinates in the Address interface
- **Full Address Data**: Returns complete address data including Google Maps data (coordinates, formattedAddress, placeId)

### Features

#### Distance Display
- **Location**: Displayed below package type selection in the NewBooking form
- **Information Shown**:
  - Total distance (formatted, e.g., "15.2 km")
  - Estimated travel time (when available from Google Maps)
  - Calculation method (Google Maps Route vs Straight Line)
- **Visual Design**: Clean card layout with Route icon and loading states

#### Calculation Methods
1. **Google Maps Distance Matrix API** (Primary)
   - Provides routing distance considering roads, traffic patterns
   - Includes estimated travel time
   - More accurate for real-world delivery planning
   
2. **Haversine Formula** (Fallback)
   - Calculates straight-line distance between two coordinates
   - Used when Google Maps API is unavailable or fails
   - Reliable backup for basic distance estimation

#### Smart Recalculation
- **Coordinate Change Detection**: Only recalculates if coordinates change significantly (>0.001 degrees ≈ 100 meters)
- **Performance Optimization**: Prevents unnecessary API calls
- **Automatic Updates**: Triggers when either pickup or delivery address changes

### User Experience

#### Address Selection Flow
1. Customer selects pickup address (from saved addresses or manual input)
2. Customer selects delivery address (from saved addresses or manual input)
3. If both addresses have coordinates, distance calculation automatically triggers
4. Distance appears below package type with loading indicator
5. Result displays with distance, duration (if available), and method used

#### Distance Display States
- **Loading**: "Calculating distance..." with spinner
- **Success**: Shows formatted distance, duration, and calculation method
- **Error**: "Unable to calculate distance. Please check addresses."
- **Incomplete**: "Complete pickup and delivery addresses to see distance"
- **No Coordinates**: "Select addresses with coordinates to calculate distance"

### Technical Integration

#### Address Data Flow
```typescript
interface Address {
  // Existing fields...
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  formattedAddress?: string;
  placeId?: string;
}
```

#### Form Data Enhancement
```typescript
interface FormData {
  // Existing fields...
  distance?: DistanceResult;
}

interface DistanceResult {
  distance: number; // in kilometers
  duration?: number; // in minutes
  formattedDistance: string;
  formattedDuration?: string;
  method: 'google_maps' | 'haversine';
}
```

### Error Handling and Fallbacks

#### Graceful Degradation
1. **Google Maps API Unavailable**: Falls back to Haversine calculation
2. **Network Issues**: Shows error message, allows form submission to continue
3. **Invalid Coordinates**: Validates coordinates before calculation
4. **API Rate Limits**: Implements proper error handling and fallback

#### User-Friendly Messages
- Clear indication of calculation method used
- Helpful error messages that don't block the booking process
- Visual distinction between accurate routing distance vs straight-line distance

### Benefits

#### For Customers
- **Transparency**: Clear visibility into delivery distance before booking
- **Planning**: Helps set expectations for delivery logistics
- **Trust**: Professional appearance with accurate distance information

#### For Business
- **Pricing**: Distance data available for dynamic pricing calculations
- **Route Planning**: Accurate distance helps with delivery scheduling
- **Customer Service**: Reduces inquiries about delivery distances

### Future Enhancements

#### Potential Improvements
1. **Dynamic Pricing**: Use distance data for automatic pricing adjustments
2. **Route Optimization**: Multi-stop route planning for bulk deliveries
3. **Delivery Time Estimates**: More accurate delivery time predictions
4. **Traffic Considerations**: Real-time traffic data for better estimates
5. **Distance-Based Service Options**: Different service levels based on distance

### Testing

#### Test Component
Created `DistanceCalculationTest.tsx` for manual testing:
- Input fields for custom coordinates
- Test buttons for both Google Maps and Haversine calculations
- Result display with detailed information
- Pre-filled coordinates for major Indian cities

#### Test Cases
- **Delhi to Mumbai**: ~1,150 km (major route test)
- **Local delivery**: <50 km (typical delivery distance)
- **Invalid coordinates**: Error handling verification
- **Google Maps unavailable**: Fallback method testing

### Installation and Setup

#### Prerequisites
- Google Maps API key configured in the project
- Address data includes coordinates from LocationPicker/AddressManager

#### Dependencies
- All distance calculation code is self-contained in the utility file
- Uses existing Google Maps integration
- No additional npm packages required

#### Configuration
- Distance calculation automatically uses the existing Google Maps configuration
- Fallback method works without any external dependencies
- Customizable distance threshold for recalculation (default: 0.001 degrees)

This feature significantly enhances the booking experience by providing transparent distance information while maintaining robust fallback options and error handling.
