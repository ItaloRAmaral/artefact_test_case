import { Modal } from '@/client/shared/modal';
import { TaskForm } from '@/client/shared/task-form';

export default function NewTaskModal() {
  return (
    <Modal title="New task">
      <TaskForm />
    </Modal>
  );
}
