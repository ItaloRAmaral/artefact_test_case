import Link from 'next/link';

import { TaskForm } from '@/client/shared/task-form';

export default function NewTaskPage() {
  return (
    <main>
      <h1>New task</h1>
      <TaskForm />
      <Link href="/">Back to tasks</Link>
    </main>
  );
}
