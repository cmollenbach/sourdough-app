import React, { useState, useEffect } from 'react';
import { useRecipeBuilderStore } from '../../store/recipeBuilderStore';
// Ensure this StepTemplate type matches the structure from /meta/step-templates
// It might need to be StepTemplate from '.../types/recipeLayout' or recipe.ts needs to be adjusted
import type { StepTemplate } from '@sourdough/shared'; // Changed to recipeLayout.ts
import Modal from '../../components/Shared/Modal'; // Assuming this component exists
import { updateStepTemplate, deleteStepTemplate } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

// Define a more specific error type, assuming AxiosError structure
interface ApiError {
  response?: { data?: { error?: string } };
}

export default function StepTemplatesPage() {
  const stepTemplates = useRecipeBuilderStore((state) => state.stepTemplates);
  const fetchAllMetaData = useRecipeBuilderStore((state) => state.fetchAllMetaData);
  const loading = useRecipeBuilderStore((state) => state.loading);
  const error = useRecipeBuilderStore((state) => state.error);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StepTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); 
  const { showToast } = useToast();

  useEffect(() => {
    fetchAllMetaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditClick = (template: StepTemplate) => {
    setSelectedTemplate(template);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (template: StepTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedTemplate(null);
  };

  const handleSaveChanges = async (updatedData: { name: string, description: string }) => {
    if (!selectedTemplate) return;

    try {
      await updateStepTemplate(selectedTemplate.id, updatedData);
      showToast('Template updated successfully!', { type: 'success' });
      await fetchAllMetaData(); // Refresh data
      handleCloseModals();
    } catch (error: unknown) {
      const errorMessage = (error as ApiError)?.response?.data?.error || 'Failed to update template.';
      showToast(errorMessage, { type: 'error' });
      console.error(error);
      // Do not close modal on error, allow user to retry or see message
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return;
    setIsDeleting(true);
    try {
      await deleteStepTemplate(selectedTemplate.id);
      showToast('Template deleted successfully!', { type: 'success' });
      await fetchAllMetaData(); // Refresh data
      handleCloseModals();
    } catch (error: unknown) {
      const errorMessage = (error as ApiError)?.response?.data?.error || 'Failed to delete template.';
      showToast(errorMessage, { type: 'error' });
      console.error(error);
      // Do not close delete modal on error, so user can see the message or retry.
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="container mx-auto p-4 text-center">Loading templates...</div>;
  if (error) return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Manage Step Templates</h1>
      <div className="bg-surface-elevated shadow-md rounded-lg overflow-hidden">
        {stepTemplates.length === 0 && !loading && (
          <p className="p-4 text-text-secondary">No step templates found.</p>
        )}
        <ul className="divide-y divide-border-subtle">
          {stepTemplates.sort((a,b) => a.id - b.id).map((template) => (
            <li key={template.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
              <div>
                <p className="font-semibold text-text-primary">{template.name}</p>
                <p className="text-sm text-text-secondary">{template.description}</p>
              </div>
              <div className="flex space-x-2 self-end sm:self-center">
                <button
                  onClick={() => handleEditClick(template)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(template)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isEditModalOpen && selectedTemplate && (
        <EditStepTemplateModal
          template={selectedTemplate}
          onClose={handleCloseModals}
          onSave={handleSaveChanges}
        />
      )}

      {isDeleteModalOpen && selectedTemplate && (
        <Modal 
          isOpen={isDeleteModalOpen}
          onClose={handleCloseModals}
          title="Confirm Deletion"
        >
          <div className="text-text-primary">
            <p>Are you sure you want to delete the template "<strong>{selectedTemplate.name}</strong>"?</p>
            <p className="text-sm text-red-500 mt-2">This action cannot be undone and might affect recipes using this template if not handled.</p>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={handleCloseModals} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed">
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditStepTemplateModal({
  template,
  onClose,
  onSave,
}: {
  template: StepTemplate;
  onClose: () => void;
  onSave: (data: { name: string, description: string }) => Promise<void>;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Template name cannot be empty.', { type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ name, description: description || '' }); // Provide a default empty string if description is undefined
    } finally {
      setIsSaving(false); 
    }
  };

  return (
    <Modal 
      isOpen={true} // Since EditStepTemplateModal is only rendered when isEditModalOpen is true
      onClose={onClose}
      title={`Edit: ${template.name}`}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-border-subtle rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-border-subtle rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-70 disabled:cursor-not-allowed">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
