import { RouterProvider } from 'react-router/dom';
import { router } from './router.tsx';

// Root component. Later phases wrap the router with providers (auth, toasts).
export default function App() {
  return <RouterProvider router={router} />;
}
