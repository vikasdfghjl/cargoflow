# Google Maps Integration Demo Setup

## � Stable Implementation

**Current Status:** Using the stable Google Places `Autocomplete` API for reliable address search functionality.

**Why Stable Implementation:**
- ✅ Production-ready and thoroughly tested
- ✅ Consistent cross-browser support
- ✅ No experimental API compatibility issues
- ✅ Extensive documentation and community support

## Quick Demo Setup

To test the new Google Maps location picker feature:

### 1. Get Google Maps API Key (Free Tier Available)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Go to "APIs & Services" > "Library"
4. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
5. Go to "APIs & Services" > "Credentials"
6. Click "Create Credentials" > "API Key"
7. Copy your API key

### 2. Configure Environment

```bash
# In frontend/.env file
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Test the Feature

1. Start the application:
   ```bash
   # Backend (in one terminal)
   cd backend && npm run dev
   
   # Frontend (in another terminal)  
   cd frontend && npm run dev
   ```

2. Navigate to Customer Dashboard → Addresses
3. Click "Add Address" 
4. Try both tabs:
   - **Manual Entry**: Traditional form
   - **Map Location**: Google Maps integration

### 4. Demo Features

**In Map Location Tab:**
- Search for "Times Square, New York" in the search box
- Click the location button (📍) to use your current location
- Click anywhere on the map to place a marker
- Drag the marker to a new position
- Watch address fields auto-populate

**Address Management:**
- Save addresses with GPS coordinates
- Notice "GPS Location Available" badge on map-based addresses
- Edit existing addresses to add map locations

## Demo Scenarios

### Scenario 1: Office Address
1. Switch to "Map Location" tab
2. Search for "Google Headquarters, Mountain View"
3. Click on the suggested result
4. Fine-tune marker position by dragging
5. Add contact details and save

### Scenario 2: Home Address  
1. Click the current location button (📍)
2. Allow browser to access your location
3. Adjust the marker if needed
4. Complete the address details
5. Save as default address

### Scenario 3: Delivery Location
1. Search for a landmark like "Central Park, New York"
2. Click on the map to place marker at specific entrance
3. Add delivery instructions like "North entrance, near playground"
4. Save for future bookings

## Fallback Behavior

If API key is not configured:
- Feature gracefully falls back to manual entry only
- Users see helpful setup message
- No broken functionality

## Testing Checklist

- [ ] Search autocomplete works
- [ ] Map click placement works  
- [ ] Marker dragging works
- [ ] Current location button works
- [ ] Address auto-population works
- [ ] Form validation still works
- [ ] Save/edit functionality works
- [ ] GPS badge displays correctly

## Notes

- Free tier includes 28,500 map loads per month
- Development/testing usage is typically well within free limits
- Location services require HTTPS in production

## Troubleshooting

**Map not loading?**
- Check browser console for errors
- Verify API key is correct
- Ensure APIs are enabled in Google Cloud

**Location button not working?**
- HTTPS required for geolocation
- Check browser location permissions
- Try in different browsers

**Search not working?**  
- Verify Places API is enabled
- Check API quotas in Google Cloud Console

---

Ready to test precise location selection! 🗺️✨
