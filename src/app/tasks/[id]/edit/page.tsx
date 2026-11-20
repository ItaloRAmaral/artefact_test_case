import Link from 'next/link';
import { Suspense } from 'react';

import { EditTask } from '@/client/shared/edit-task';

export default function EditTaskPage({
  params,
}: PageProps<'/tasks/[id]/edit'>) {
  // Without generateStaticParams the id is only known per request, so Cache Components
  // need it read inside Suspense; the static shell is the heading and the fallback.
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
