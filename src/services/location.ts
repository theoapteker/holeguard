import * as Location from 'expo-location';

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

export const watchLocation = (
  callback: (location: Location.LocationObject) => void
): (() => void) => {
  let subscription: Location.LocationSubscription | null = null;

  const startWatching = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 100,
      },
      callback
    );
  };

  startWatching();

  return () => {
    if (subscription) {
      subscription.remove();
    }
  };
};
