import Link from 'next/link';

import { TaskForm } from '@/client/shared/task-form';

/**
 * Renders the create form as a full page.
 *
 * @returns The page with the form.
 */
export default function NewTaskPage() {
  return (
    <main>
      <Link href="/" className="text-muted hover:underline">
        ← Back to tasks
      </Link>
      <h1 className="page-title mt-2 mb-6">New task</h1>
      <div className="card p-6">
        <TaskForm />
      </div>
    </main>
  );
}
