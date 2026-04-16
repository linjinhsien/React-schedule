/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LoginGate } from './components/LoginGate';
import { EmployeePage } from './pages/EmployeePage';
import { BossPage } from './pages/BossPage';
import { useAuth } from './auth/useAuth';

function MainApp() {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === 'boss' ? <BossPage /> : <EmployeePage />;
}

export default function App() {
  return (
    <LoginGate>
      <MainApp />
    </LoginGate>
  );
}
