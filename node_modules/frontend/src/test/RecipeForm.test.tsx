// src/test/RecipeForm.test.tsx
import { render, screen, fireEvent, waitFor } from './utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecipeForm from '../RecipeForm';
import * as api from '../utils/api';

// Mock the API module
vi.mock('../utils/api', () => ({
  createRecipe: vi.fn(),
  getRecipeFields: vi.fn(),
}));

const mockApiModule = vi.mocked(api);

describe('RecipeForm', () => {
  const mockFields = [
    { name: 'name', type: 'text', label: 'Recipe Name', required: true },
    { name: 'totalWeight', type: 'number', label: 'Total Weight (g)', required: true },
    { name: 'hydrationPct', type: 'number', label: 'Hydration %', required: true },
    { name: 'saltPct', type: 'number', label: 'Salt %', required: true },
    { name: 'notes', type: 'textarea', label: 'Notes', required: false }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiModule.getRecipeFields.mockResolvedValue(mockFields);
  });

  // === HAPPY PATH TESTS ===
  describe('Happy Path', () => {
    it('renders form fields correctly', async () => {
      render(<RecipeForm />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/total weight/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/hydration/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/salt/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data successfully', async () => {
      const onCreated = vi.fn();
      mockApiModule.createRecipe.mockResolvedValue({ id: 1, name: 'My Sourdough' });
      
      render(<RecipeForm onCreated={onCreated} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/recipe name/i), { 
        target: { value: 'My Sourdough' } 
      });
      fireEvent.change(screen.getByLabelText(/total weight/i), { 
        target: { value: '1000' } 
      });
      fireEvent.change(screen.getByLabelText(/hydration/i), { 
        target: { value: '75' } 
      });
      fireEvent.change(screen.getByLabelText(/salt/i), { 
        target: { value: '2' } 
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit|create/i }));

      await waitFor(() => {
        expect(mockApiModule.createRecipe).toHaveBeenCalledWith({
          name: 'My Sourdough',
          totalWeight: 1000,
          hydrationPct: 75,
          saltPct: 2,
          notes: ''
        });
        expect(onCreated).toHaveBeenCalled();
      });
    });

    it('shows success message after successful submission', async () => {
      mockApiModule.createRecipe.mockResolvedValue({ id: 1, name: 'Test Recipe' });
      
      render(<RecipeForm />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      // Fill required fields and submit
      fireEvent.change(screen.getByLabelText(/recipe name/i), { 
        target: { value: 'Test Recipe' } 
      });
      fireEvent.click(screen.getByRole('button', { name: /submit|create/i }));

      await waitFor(() => {
        expect(screen.getByText(/success|created/i)).toBeInTheDocument();
      });
    });
  });

  // === EDGE CASE TESTS ===
  describe('Edge Cases', () => {
    it('handles empty form submission', async () => {
      render(<RecipeForm />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit|create/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /submit|create/i }));

      // Should prevent submission or show validation errors
      expect(mockApiModule.createRecipe).not.toHaveBeenCalled();
    });

    it('handles very large numbers in weight fields', async () => {
      render(<RecipeForm />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/total weight/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/total weight/i), { 
        target: { value: '999999999' } 
      });

      expect(screen.getByLabelText(/total weight/i)).toHaveValue(999999999);
    });

    it('handles negative numbers in percentage fields', async () => {
      render(<RecipeForm />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/hydration/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/hydration/i), { 
        target: { value: '-10' } 
      });

      expect(screen.getByLabelText(/hydration/i)).toHaveValue(-10);
    });

    it('handles special characters in recipe name', async () => {
      render(<RecipeForm />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const specialCharsName = "Recipe w/ Special-Characters & Símböls!";
      fireEvent.change(screen.getByLabelText(/recipe name/i), { 
        target: { value: specialCharsName } 
      });

      expect(screen.getByLabelText(/recipe name/i)).toHaveValue(specialCharsName);
    });
  });

  // === ERROR HANDLING TESTS ===
  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const errorMessage = 'Failed to create recipe';
      mockApiModule.createRecipe.mockRejectedValue(new Error(errorMessage));
      
      render(<RecipeForm />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/recipe name/i), { 
        target: { value: 'Test Recipe' } 
      });
      fireEvent.click(screen.getByRole('button', { name: /submit|create/i }));

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('handles network timeout gracefully', async () => {
      mockApiModule.createRecipe.mockRejectedValue(new Error('Network timeout'));
      
      render(<RecipeForm />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/recipe name/i), { 
        target: { value: 'Test Recipe' } 
      });
      fireEvent.click(screen.getByRole('button', { name: /submit|create/i }));

      await waitFor(() => {
        expect(screen.getByText(/network|timeout|connection/i)).toBeInTheDocument();
      });
    });

    it('handles getRecipeFields API failure', async () => {
      mockApiModule.getRecipeFields.mockRejectedValue(new Error('Failed to load fields'));
      
      render(<RecipeForm />);

      await waitFor(() => {
        // Should show error state or fallback UI
        expect(screen.getByText(/error|failed to load/i)).toBeInTheDocument();
      });
    });

    it('validates required fields before submission', async () => {
      render(<RecipeForm />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit|create/i })).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      fireEvent.click(screen.getByRole('button', { name: /submit|create/i }));

      // Should show validation errors for required fields
      expect(mockApiModule.createRecipe).not.toHaveBeenCalled();
    });
  });
});
