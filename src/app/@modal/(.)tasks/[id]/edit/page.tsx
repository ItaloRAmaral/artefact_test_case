import { Suspense } from 'react';

import { EditTask } from '@/client/shared/edit-task';
import { Modal } from '@/client/shared/modal';

export default function EditTaskModal({
  params,
}: PageProps<'/tasks/[id]/edit'>) {
  // Same as the full edit page: the id is known only per request, so it is read inside
  // Suspense (Cache Components).
  return (
    <Modal title="Edit task">
      <Suspense fallback={<p className="text-muted">Loading task…</p>}>
        {params.then(({ id }) => (
          <EditTask id={id} />
        ))}
      </Suspense>
    </Modal>
  );
}
