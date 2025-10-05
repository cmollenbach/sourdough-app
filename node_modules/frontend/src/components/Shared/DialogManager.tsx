import { useDialog } from '../../context/useDialog'; // Updated import path
import Modal from './Modal'; // Assuming Modal.tsx is in the same Shared directory

export default function DialogManager() {
  const { isOpen, options, hideDialog } = useDialog();

  if (!isOpen || !options) {
    return null;
  }

  const handleConfirm = () => {
    if (options.onConfirm) {
      options.onConfirm();
    }
    // The Modal's internal handleConfirm already calls onClose, which is hideDialog.
    // So, we don't need to call hideDialog() here explicitly if Modal handles it.
    // However, if Modal's onConfirm didn't call onClose, we would call hideDialog() here.
  };

  const handleCancel = () => {
    if (options.onCancel) {
      options.onCancel();
    }
    // The Modal's internal handleCancel calls onClose, which is hideDialog.
    // So, we don't need to call hideDialog() here explicitly.
  };

  return (
    <Modal
      isOpen={isOpen}
      title={options.title}
      onClose={hideDialog} // This is the primary way to close the modal
      confirmText={options.confirmText}
      onConfirm={options.onConfirm ? handleConfirm : undefined} // Pass if exists
      cancelText={options.cancelText}
      onCancel={options.onCancel ? handleCancel : undefined} // Pass if exists
      hideConfirmButton={options.hideConfirmButton}
      hideCancelButton={options.hideCancelButton}
    >
      {options.content}
    </Modal>
  );
}