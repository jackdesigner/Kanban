import KanbanBoard from '@/components/KanbanBoard';
import AuthGate from '@/components/AuthGate';

export default function HomePage() {
  return (
    <AuthGate>
      <KanbanBoard />
    </AuthGate>
  );
}