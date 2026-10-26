import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services';

export interface LiveLocationState {
  coords: { lat: number; lng: number } | null;
  locationName: string;
  isLocating: boolean;
  permissionGranted: boolean;
  errorMsg: string | null;
  refreshLocation: () => Promise<void>;
}

// In-memory cache to prevent repeated hardware GPS queries across component mounts
let _cachedCoords: { lat: number; lng: number } | null = null;
let _cachedLabel: string | null = null;

export function useLiveLocation(): LiveLocationState {
  const { user } = useAuthStore();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    _cachedCoords || (user?.location ? { lat: user.location.lat, lng: user.location.lng } : null)
  );
  const [locationName, setLocationName] = useState<string>(
    _cachedLabel || user?.location?.label || 'Detecting live location...'
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchCurrentLocation = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLocating(true);
    setErrorMsg(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        setErrorMsg('Location permission denied. Using default campus location.');
        setIsLocating(false);
        isFetchingRef.current = false;
        return;
      }
      setPermissionGranted(true);

      // Fast, balanced accuracy that avoids aggressive GPS hardware drain
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLat = loc.coords.latitude;
      const newLng = loc.coords.longitude;

      _cachedCoords = { lat: newLat, lng: newLng };
      setCoords({ lat: newLat, lng: newLng });

      // Reverse geocode to get human-friendly neighborhood/city name
      let addressLabel = _cachedLabel || 'Current Location';
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: newLat,
          longitude: newLng,
        });
        if (geo && geo.length > 0) {
          const place = geo[0];
          const parts = [
            place.name || place.street,
            place.district || place.subregion,
            place.city,
          ].filter(Boolean);
          addressLabel = parts.slice(0, 2).join(', ') || place.city || 'Campus Area';
        }
      } catch {
        // Fallback gracefully
      }

      _cachedLabel = addressLabel;
      setLocationName(addressLabel);

      // Persist to backend without blocking UI thread
      userService.updateLocation(newLat, newLng, addressLabel).catch(() => {});
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch GPS coordinates');
    } finally {
      setIsLocating(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // If not yet cached, fetch once on mount
    if (!_cachedCoords) {
      fetchCurrentLocation();
    } else {
      setPermissionGranted(true);
    }
  }, [fetchCurrentLocation]);

  return {
    coords,
    locationName,
    isLocating,
    permissionGranted,
    errorMsg,
    refreshLocation: fetchCurrentLocation,
  };
}
