import { Suspense } from 'react';

import { EditTask } from '@/client/shared/edit-task';
import { Modal } from '@/client/shared/modal';

/**
 * Renders the edit form in a modal.
 *
 * @param props.params - The route params, with the task id.
 * @returns The modal with the form.
 */
export default function EditTaskModal({
  params,
}: PageProps<'/tasks/[id]/edit'>) {
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
