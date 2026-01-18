import { AuthProvider } from './src/data/auth';
import AppNavigator from './src/ui/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
