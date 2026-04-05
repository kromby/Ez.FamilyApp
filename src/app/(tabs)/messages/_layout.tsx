import { Stack } from 'expo-router';
import { useThemeColors } from '../../../constants/theme';

export default function MessagesLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600', fontSize: 20 },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Messages' }} />
      <Stack.Screen
        name="[channelId]"
        options={{ headerBackTitle: 'Channels' }}
      />
    </Stack>
  );
}
