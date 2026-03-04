import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreatorLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4361ee',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
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
          href: null, // Hide from tab bar
          title: 'Job Details',
        }}
      />
    </Tabs>
  );
}
