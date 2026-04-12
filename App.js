import { SafeAreaProvider } from 'react-native-safe-area-context';
import DockScreen from './src/DockScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <DockScreen />
    </SafeAreaProvider>
  );
}
