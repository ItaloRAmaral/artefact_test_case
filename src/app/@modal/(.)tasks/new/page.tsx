import { Modal } from '@/client/shared/modal';
import { TaskForm } from '@/client/shared/task-form';

/**
 * Renders the create form in a modal.
 *
 * @returns The modal with the form.
 */
export default function NewTaskModal() {
  return (
    <Modal title="New task">
      <TaskForm />
    </Modal>
  );
}
