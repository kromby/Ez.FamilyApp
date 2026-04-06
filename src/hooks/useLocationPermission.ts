import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PERM_KEY = 'location_permission_asked';

// Persisted flag: has the user already seen the modal?
async function getAsked(): Promise<boolean> {
  if (Platform.OS === 'web') return localStorage.getItem(PERM_KEY) === 'true';
  const v = await SecureStore.getItemAsync(PERM_KEY);
  return v === 'true';
}

async function setAsked(): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem(PERM_KEY, 'true'); return; }
  await SecureStore.setItemAsync(PERM_KEY, 'true');
}

export function useLocationPermission() {
  const [ready, setReady] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    (async () => {
      // Step 1: Check if system already has a permission decision (handles reinstall — Pitfall 4)
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setGranted(true);
        await setAsked();
        setReady(true);
        return;
      }
      if (status === 'denied') {
        // System already denied — don't show our modal, just mark as asked
        await setAsked();
        setReady(true);
        return;
      }

      // Step 2: status is 'undetermined' — check if we've already asked via our modal
      const alreadyAsked = await getAsked();
      if (alreadyAsked) {
        setReady(true);
        return;
      }

      // Step 3: Show our custom modal
      setShouldShowModal(true);
      setReady(true);
    })();
  }, []);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setGranted(status === 'granted');
    await setAsked();
    setShouldShowModal(false);
  };

  const dismissModal = async () => {
    await setAsked();
    setShouldShowModal(false);
  };

  return { ready, shouldShowModal, granted, requestPermission, dismissModal };
}
