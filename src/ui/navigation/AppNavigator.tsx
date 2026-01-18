import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import PracticeScreen from '../screens/PracticeScreen';
import PostPracticeScreen from '../screens/PostPracticeScreen';
import LogMomentScreen from '../screens/LogMomentScreen';
import MapScreen from '../screens/MapScreen';
import EntriesScreen from '../screens/EntriesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Practice" component={PracticeScreen} />
        <Stack.Screen name="PostPractice" component={PostPracticeScreen} />
        <Stack.Screen name="LogMoment" component={LogMomentScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Entries" component={EntriesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
