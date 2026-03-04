import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';

function AuthGate() {
  const { session, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      // Not signed in — go to login
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else if (role === 'jobber') {
      if (segments[0] !== '(jobber)') router.replace('/(jobber)/feed');
    } else if (role === 'creator') {
      if (segments[0] !== '(creator)') router.replace('/(creator)/my-jobs');
    }
  }, [session, role, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
