import { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

export default function CreatorLayout() {
  const { user } = useAuth();
  const [newApplicants, setNewApplicants] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchNewApplicants();

    // Re-fetch every 30 seconds
    const interval = setInterval(fetchNewApplicants, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function fetchNewApplicants() {
    if (!user) return;

    const { data: jobIds } = await supabase
      .from('jobs')
      .select('id')
      .eq('creator_id', user.id);

    const ids = jobIds?.map((j: any) => j.id) ?? [];
    if (ids.length === 0) { setNewApplicants(0); return; }

    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('job_id', ids)
      .eq('status', 'pending');

    setNewApplicants(count ?? 0);
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
        name="my-jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
          tabBarBadge: newApplicants > 0 ? newApplicants : undefined,
        }}
      />
      <Tabs.Screen
        name="create-job"
        options={{
          title: 'Post Job',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
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
        name="job/[id]"
        options={{
          href: null,
          title: 'Job Details',
        }}
      />
      <Tabs.Screen
        name="edit-job/[id]"
        options={{
          href: null,
          title: 'Edit Job',
        }}
      />
      <Tabs.Screen
        name="applicant/[id]"
        options={{
          href: null,
          title: 'Applicant Profile',
        }}
      />
      <Tabs.Screen
        name="send-offer/[id]"
        options={{
          href: null,
          title: 'Send Offer',
        }}
      />
    </Tabs>
  );
}
