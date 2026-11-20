import Link from 'next/link';
import { Suspense } from 'react';

import { EditTask } from './_components/edit-task';

export default function EditTaskPage({
  params,
}: PageProps<'/tasks/[id]/edit'>) {
  // Without generateStaticParams the id is only known per request, so Cache Components
  // need it read inside Suspense; the static shell is the heading and the fallback.
  return (
    <main>
      <h1>Edit task</h1>
      <Suspense fallback={<p>Loading task…</p>}>
        {params.then(({ id }) => (
          <EditTask id={id} />
        ))}
      </Suspense>
      <Link href="/">Back to tasks</Link>
    </main>
  );
}
