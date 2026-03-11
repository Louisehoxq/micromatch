import { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

export default function JobberLayout() {
  const { user } = useAuth();
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchMatchCount();

    // Re-fetch every 30 seconds
    const interval = setInterval(fetchMatchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function fetchMatchCount() {
    if (!user) return;

    const { data } = await supabase.rpc('get_matched_jobs', {
      p_jobber_id: user.id,
    });

    setMatchCount(data?.length ?? 0);
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4361ee',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
          tabBarBadge: matchCount > 0 ? matchCount : undefined,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="commitment/[id]"
        options={{ href: null, title: 'Committed Job' }}
      />
    </Tabs>
  );
}
