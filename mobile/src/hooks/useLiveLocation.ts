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

export function useLiveLocation(): LiveLocationState {
  const { user, setUser } = useAuthStore();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    user?.location ? { lat: user.location.lat, lng: user.location.lng } : null
  );
  const [locationName, setLocationName] = useState<string>(
    user?.location?.label || 'Detecting live location...'
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const fetchCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        setErrorMsg('Location permission denied. Using campus default.');
        setIsLocating(false);
        return;
      }
      setPermissionGranted(true);

      // Get high-accuracy current live location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLat = loc.coords.latitude;
      const newLng = loc.coords.longitude;
      setCoords({ lat: newLat, lng: newLng });

      // Reverse geocode to get real-time address/neighborhood
      let addressLabel = 'Current Location';
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
        // Fallback to coordinates or existing label
      }

      setLocationName(addressLabel);

      // Persist to user store and service
      if (user) {
        setUser({
          ...user,
          location: { lat: newLat, lng: newLng, label: addressLabel },
        });
      }
      await userService.updateLocation(newLat, newLng, addressLabel);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch GPS coordinates');
    } finally {
      setIsLocating(false);
    }
  }, [user]);

  // Start watching location on mount
  useEffect(() => {
    fetchCurrentLocation();

    // Subscribe to live position updates if permissions allow
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const sub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000,
              distanceInterval: 25, // update every 25 meters
            },
            async (pos) => {
              const liveLat = pos.coords.latitude;
              const liveLng = pos.coords.longitude;
              setCoords({ lat: liveLat, lng: liveLng });
            }
          );
          watchSubscriptionRef.current = sub;
        }
      } catch {}
    })();

    return () => {
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
    };
  }, []);

  return {
    coords,
    locationName,
    isLocating,
    permissionGranted,
    errorMsg,
    refreshLocation: fetchCurrentLocation,
  };
}
