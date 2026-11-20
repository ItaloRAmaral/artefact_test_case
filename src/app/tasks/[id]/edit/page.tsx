import Link from 'next/link';
import { Suspense } from 'react';

import { EditTask } from '@/client/shared/edit-task';

/**
 * Renders the edit form as a full page.
 *
 * @param props.params - The route params, with the task id.
 * @returns The page with the form.
 */
export default function EditTaskPage({
  params,
}: PageProps<'/tasks/[id]/edit'>) {
  return (
    <main>
      <Link href="/" className="text-muted hover:underline">
        ← Back to tasks
      </Link>
      <h1 className="page-title mt-2 mb-6">Edit task</h1>
      <div className="card p-6">
        <Suspense fallback={<p className="text-muted">Loading task…</p>}>
          {params.then(({ id }) => (
            <EditTask id={id} />
          ))}
        </Suspense>
      </div>
    </main>
  );
}
