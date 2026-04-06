import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from '../stores/session';
import { useLocationPermission } from '../hooks/useLocationPermission';
import { LocationPermissionModal } from '../components/location/LocationPermissionModal';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootNavigator() {
  const { session, isLoading } = useSession();
  const { shouldShowModal, requestPermission, dismissModal } = useLocationPermission();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <>
      <Stack>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      {session && (
        <LocationPermissionModal
          visible={shouldShowModal}
          onAllow={requestPermission}
          onDismiss={dismissModal}
        />
      )}
    </>
  );
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </QueryClientProvider>
  );
}
