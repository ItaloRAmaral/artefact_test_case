import Link from 'next/link';

import { TaskForm } from '@/client/shared/task-form';

export default function NewTaskPage() {
  return (
    <main>
      <Link href="/" className="text-muted hover:underline">
        ← Back to tasks
      </Link>
      <h1 className="page-title mt-2 mb-6">New task</h1>
      <TaskForm />
    </main>
  );
}
