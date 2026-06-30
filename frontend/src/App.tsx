import AppRouter from '@/app/router';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function App() {
  useWebSocket();
  return <AppRouter />;
}
