import { create } from 'zustand';
import api from '../utils/api'; // Your existing Axios instance
import type { Bake, BakeStep, BakeStepParameterValue } from '@sourdough/shared';
import { notificationService } from '../services/CapacitorNotificationService';
import { Capacitor } from '@capacitor/core';


interface BakeState {
  activeBakes: Bake[];
  currentBake: Bake | null; // For viewing/managing a single active bake
  allBakes: Bake[]; // For the history page
  isLoading: boolean;
  error: string | null;

  fetchActiveBakes: () => Promise<void>;
  fetchBakeById: (bakeId: number) => Promise<Bake | null>; // Use number for ID
  startBake: (recipeId: number, notes?: string) => Promise<Bake | null>; // Use number for ID, notes for name/description
  cancelBake: (bakeId: number) => Promise<Bake | null>;
  completeBake: (bakeId: number) => Promise<Bake | null>;
  fetchAllBakes: () => Promise<void>; // New action for history
  updateBakeRating: (bakeId: number, rating: number | null) => Promise<Bake | null>;
  updateBakeNotes: (bakeId: number, notes: string | null) => Promise<Bake | null>;

  startStep: (bakeId: number, stepId: number) => Promise<BakeStep | null>;
  completeStep: (
    bakeId: number,
    stepId: number,
    payload: {
      actualParameterValues?: { [parameterId: number]: unknown };
      notes?: string;
      deviations?: unknown;
    }
  ) => Promise<BakeStep | null>;
  skipStep: (bakeId: number, stepId: number) => Promise<BakeStep | null>;

  // Update actual value for a specific BakeStepParameterValue
  updateStepParameterActualValue: (
    bakeId: number,
    stepId: number,
    parameterValueId: number, // ID of the BakeStepParameterValue record
    actualValue: unknown,
    notes?: string
  ) => Promise<BakeStepParameterValue | null>;

  updateStepNote: (bakeId: number, stepId: number, notes: string) => Promise<BakeStep | null>;
  updateStepDeviations: (bakeId: number, stepId: number, deviations: unknown) => Promise<BakeStep | null>;
  updateStepParameterPlannedValue: (
    bakeId: number,
    stepId: number,
    parameterValueId: number,
    plannedValue: unknown
  ) => Promise<BakeStepParameterValue | null>;

  // You might also want a function to update BakeStep.deviations
  _updateStepInState: (updatedStep: BakeStep) => void; // Declare the helper method in the interface

  clearError: () => void;
}

// Helper type for expected Axios error structure
interface AxiosErrorWithMessage {
  response?: {
    data?: {
      message?: string;
      details?: string; // If your backend sometimes sends 'details'
    };
  };
  message?: string; // Standard error message property
}

export const useBakeStore = create<BakeState>((set, get) => ({
  activeBakes: [],
  currentBake: null,
  allBakes: [], // Initialize new state
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchActiveBakes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Bake[]>('/bakes/active');
      set({ activeBakes: response.data, isLoading: false });
    } catch (err: unknown) {
      let message = 'Failed to fetch active bakes.';
      const axiosError = err as AxiosErrorWithMessage; // Type assertion
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error('Failed to fetch active bakes:', err);
      set({ error: message, isLoading: false });
    }
  },

  fetchBakeById: async (bakeId: number) => {
    // Set isLoading and clear previous error. Optionally clear currentBake or keep it to avoid UI flicker.
    // If the bake currently in `currentBake` is the one we're about to fetch,
    // set it to `null`. This prevents displaying a stale or summary version
    // of the target bake while the full details are being fetched.
    // If `currentBake` holds a different bake, it remains, allowing the UI to show
    // the old bake's data until the new one is loaded.
    try {
      set(state => ({
        isLoading: true,
        error: null,
        currentBake: state.currentBake?.id === bakeId ? null : state.currentBake,
      }));
      // Always fetch the full bake details from the API for the detail page
      // to ensure freshness and completeness, avoiding "Unnamed Step" issues.
      const response = await api.get<Bake>(`/bakes/${bakeId}`);
      const fetchedBake = response.data;

      if (fetchedBake) {
        set({ currentBake: fetchedBake, isLoading: false });
        // Also, update this bake in the activeBakes list if it exists there,
        // to keep the list consistent with the detailed view if the user navigates back.
        // This ensures that if activeBakes had a summary, it gets updated with the full data.
        set(state => ({
          activeBakes: state.activeBakes.map(b => b.id === bakeId ? fetchedBake : b),
        }));
        return fetchedBake;
      } else {
        // This case might occur if the API returns 200 but with null/empty data.
        set({ currentBake: null, isLoading: false, error: `Bake ${bakeId} not found or data is invalid.` });
        return null;
      }
    } catch (err: unknown) {
      let message = `Failed to fetch bake ${bakeId}.`;
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error(`Failed to fetch bake ${bakeId}:`, err);
      set({ error: message, isLoading: false, currentBake: null }); // Ensure currentBake is null on error
      return null;
    }
  },

  startBake: async (recipeId: number, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<Bake>('/bakes', { recipeId, notes });
      const newBake = response.data;
      
      // Schedule notifications for the bake steps (only on native platforms)
      if (Capacitor.isNativePlatform() && newBake.steps && newBake.steps.length > 0) {
        try {
          const totalSteps = newBake.steps.length;
          // Create notifications for each step
          const notifications = newBake.steps.map((step, index) => {
            // Try to get a descriptive name from the step
            let stepName = step.recipeStep?.name || step.recipeStep?.stepTemplate?.name;
            let usingFallback = false;
            
            // If still no name, create a descriptive fallback based on order
            if (!stepName) {
              usingFallback = true;
              const stepNumber = index + 1;
              if (stepNumber === 1) stepName = 'Mix Ingredients';
              else if (stepNumber === 2) stepName = 'Autolyse';
              else if (stepNumber === 3) stepName = 'Add Salt & Starter';
              else if (totalSteps > 4 && stepNumber <= totalSteps - 2) {
                stepName = `Stretch & Fold #${stepNumber - 3}`;
              } else if (stepNumber === totalSteps - 1) stepName = 'Shape Dough';
              else if (stepNumber === totalSteps) stepName = 'Bake';
              else stepName = `Step ${stepNumber}`;
            }
            
            console.log(`[Notification] Step ${index + 1}: "${stepName}" ${usingFallback ? '(FALLBACK)' : '(FROM RECIPE)'}`);
            
            return {
              name: stepName,
              delayMinutes: (index + 1) * 30 // Simple: 30, 60, 90 min... (customize based on your needs)
            };
          });
          
          await notificationService.scheduleBakeNotifications(newBake.id, notifications);
          console.log(`Scheduled ${notifications.length} notifications for bake ${newBake.id}`, notifications);
        } catch (notifError) {
          console.error('Failed to schedule notifications for bake:', notifError);
          // Don't fail the bake if notifications fail
        }
      }
      
      set(state => ({
        activeBakes: [...state.activeBakes, newBake],
        currentBake: newBake, // Optionally set as current bake
        isLoading: false,
      }));
      return newBake;
    } catch (err: unknown) {
      let message = 'Failed to start bake.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error('Failed to start bake:', err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  cancelBake: async (bakeId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<Bake>(`/bakes/${bakeId}/cancel`);
      
      // Cancel all notifications for this bake (only on native)
      if (Capacitor.isNativePlatform()) {
        try {
          await notificationService.cancelAllNotifications();
          console.log(`Cancelled notifications for bake ${bakeId}`);
        } catch (notifError) {
          console.error('Failed to cancel notifications:', notifError);
        }
      }
      
      set(state => ({
        activeBakes: state.activeBakes.map(b => b.id === bakeId ? response.data : b).filter(b => b.active), // Update and remove if inactive
        currentBake: state.currentBake?.id === bakeId ? response.data : state.currentBake,
        isLoading: false,
      }));
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to cancel bake.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error('Failed to cancel bake:', err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  completeBake: async (bakeId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<Bake>(`/bakes/${bakeId}/complete`);
      
      // Cancel all notifications for this bake (only on native)
      if (Capacitor.isNativePlatform()) {
        try {
          await notificationService.cancelAllNotifications();
          console.log(`Cancelled notifications for completed bake ${bakeId}`);
        } catch (notifError) {
          console.error('Failed to cancel notifications:', notifError);
        }
      }
      
      set(state => ({
        activeBakes: state.activeBakes.map(b => b.id === bakeId ? response.data : b).filter(b => b.active),
        currentBake: state.currentBake?.id === bakeId ? response.data : state.currentBake,
        isLoading: false,
      }));
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to complete bake.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error('Failed to complete bake:', err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  fetchAllBakes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Bake[]>('/bakes'); // Calls GET /api/bakes
      set({ allBakes: response.data, isLoading: false });
    } catch (err: unknown) {
      let message = 'Failed to fetch all bakes.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error('Failed to fetch all bakes:', err);
      set({ error: message, isLoading: false });
    }
  },

  updateBakeRating: async (bakeId: number, rating: number | null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<Bake>(`/bakes/${bakeId}/rating`, { rating });
      set(state => ({
        activeBakes: state.activeBakes.map(b => b.id === bakeId ? response.data : b), // Update in active bakes list
        allBakes: state.allBakes.map(b => b.id === bakeId ? response.data : b), // Update in history list
        currentBake: state.currentBake?.id === bakeId ? response.data : state.currentBake,
        isLoading: false,
      }));
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to update bake rating.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error(`Failed to update bake rating for bake ${bakeId}:`, err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateBakeNotes: async (bakeId: number, notes: string | null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<Bake>(`/bakes/${bakeId}/notes`, { notes });
      set(state => ({
        activeBakes: state.activeBakes.map(b => b.id === bakeId ? response.data : b),
        allBakes: state.allBakes.map(b => b.id === bakeId ? response.data : b), // Also update in allBakes list
        currentBake: state.currentBake?.id === bakeId ? response.data : state.currentBake,
        isLoading: false,
      }));
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to update bake notes.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error(`Failed to update bake notes for bake ${bakeId}:`, err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  _updateStepInState: (updatedStep: BakeStep) => {
    set(state => {
      // Helper function to merge the updated step data carefully
      const mapStepLogic = (currentStepInState: BakeStep): BakeStep => {
        if (currentStepInState.id === updatedStep.id) {
          // Preserve the potentially more detailed recipeStep from the state
          // if the incoming updatedStep has a partial or missing recipeStep.
          const recipeStepFromState = currentStepInState.recipeStep;
          const recipeStepFromUpdate = updatedStep.recipeStep;

          let mergedRecipeStep = recipeStepFromState; // Default to state's version

          if (recipeStepFromUpdate) {
            // If update provides a recipeStep, merge it, ensuring nested details like stepTemplate are preserved
            mergedRecipeStep = {
              ...(recipeStepFromState || {}), // Base with existing (or empty object if none)
              ...recipeStepFromUpdate,       // Overlay with fields from update's recipeStep
                                             // Ensure stepTemplate is also merged carefully
              stepTemplate: recipeStepFromUpdate.stepTemplate || recipeStepFromState?.stepTemplate,
            };
          }
          // If recipeStepFromUpdate is undefined, mergedRecipeStep remains recipeStepFromState from the initial assignment.

          return {
            ...currentStepInState, // Start with the full step from state (contains all fields)
            ...updatedStep,        // Apply all updates from the API (status, notes, params etc.)
                                   // This will overwrite fields like status, startTimestamp, notes, deviations, parameterValues, etc.
            recipeStep: mergedRecipeStep, // Use the carefully merged recipeStep
          };
        }
        return currentStepInState;
      };

      const newCurrentBake = state.currentBake
        ? {
            ...state.currentBake, // Ensure steps exists before mapping
            steps: state.currentBake.steps?.map(mapStepLogic) || [], // Handle case where currentBake.steps might be null/undefined
          }
        : null;

      const newActiveBakes = state.activeBakes.map(b =>
        b.id === updatedStep.bakeId && b.steps
          ? { ...b, steps: b.steps.map(mapStepLogic) } // Apply same careful merge to activeBakes
          : b
      );
      return { currentBake: newCurrentBake, activeBakes: newActiveBakes, isLoading: false };
    });
  },

  // Actions like startStep, completeStep, skipStep, updateStepNote, updateStepDeviations
  // will call get()._updateStepInState(response.data) and their try-catch blocks remain the same.
  // No changes needed to those individual action definitions, as they rely on the improved _updateStepInState.

  // Example: startStep (no change to its own code, but it benefits from the _updateStepInState change)
   startStep: async (bakeId: number, stepId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<BakeStep>(`/bakes/${bakeId}/steps/${stepId}/start`);
      get()._updateStepInState(response.data); // This now uses the improved merge logic
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to start step.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error('Failed to start step:', err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  // Other step-related actions (completeStep, skipStep, updateStepNote, etc.)
  // also remain unchanged as they call the modified _updateStepInState.

  // The functions updateStepParameterActualValue and updateStepParameterPlannedValue
  // have their own specific logic for updating nested parameterValues and might not
  // be directly causing the "Unnamed Step" issue if recipeStep is the problem.
  // However, if those API calls also return a full BakeStep, they could also benefit
  // from calling _updateStepInState, but their current logic is more targeted.
  // For now, we assume the "Unnamed Step" is primarily related to recipeStep details.

  // ... (rest of the store code for completeStep, skipStep, updateStepParameterActualValue, etc. remains the same)
  // Make sure they also call get()._updateStepInState(response.data) if they return a BakeStep
  // and are intended to update the step broadly.

  completeStep: async (bakeId: number, stepId: number, payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<BakeStep>(`/bakes/${bakeId}/steps/${stepId}/complete`, payload);
      get()._updateStepInState(response.data);
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to complete step.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error(`Failed to complete step ${stepId} for bake ${bakeId}:`, err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  skipStep: async (bakeId: number, stepId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<BakeStep>(`/bakes/${bakeId}/steps/${stepId}/skip`);
      get()._updateStepInState(response.data);
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to skip step.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error(`Failed to skip step ${stepId} for bake ${bakeId}:`, err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateStepParameterActualValue: async (bakeId, stepId, parameterValueId, actualValue, notes) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<BakeStepParameterValue>(
        `/bakes/${bakeId}/steps/${stepId}/parameters/${parameterValueId}/actual`,
        { actualValue, notes }
      );
      // This only returns BakeStepParameterValue, need to update it within the step, then bake
      set(state => {
        const updateParamInStep = (step: BakeStep) => {
          // Ensure parameterValues exists before mapping
          const newParameterValues = step.parameterValues?.map((p: BakeStepParameterValue) => p.id === parameterValueId ? response.data : p) || [];
          return { ...step, parameterValues: newParameterValues };
        };

        const newCurrentBake = state.currentBake?.id === bakeId && state.currentBake.steps
          ? {
              ...state.currentBake,
              steps: state.currentBake.steps.map(s =>
                s.id === stepId ? { ...s, parameterValues: s.parameterValues.map((p: BakeStepParameterValue) => p.id === parameterValueId ? response.data : p) } : s
              )
            }
          : state.currentBake;

        const newActiveBakes = state.activeBakes.map(b =>
          b.id === bakeId && b.steps // Ensure b.steps exists
            ? { ...b, steps: b.steps.map(s => s.id === stepId ? updateParamInStep(s) : s) }
            : b
        );
        return { currentBake: newCurrentBake, activeBakes: newActiveBakes, isLoading: false };
      });
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to update parameter actual value.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error(`Failed to update parameter actual value for bake ${bakeId}, step ${stepId}:`, err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateStepNote: async (bakeId: number, stepId: number, notes: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<BakeStep>(`/bakes/${bakeId}/steps/${stepId}/note`, { notes });
      get()._updateStepInState(response.data);
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to update step note.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error(`Failed to update step note for bake ${bakeId}, step ${stepId}:`, err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateStepDeviations: async (bakeId: number, stepId: number, deviations: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<BakeStep>(`/bakes/${bakeId}/steps/${stepId}/deviations`, { deviations });
      get()._updateStepInState(response.data);
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to update step deviations.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error(`Failed to update step deviations for bake ${bakeId}, step ${stepId}:`, err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateStepParameterPlannedValue: async (bakeId, stepId, parameterValueId, plannedValue) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<BakeStepParameterValue>(
        `/bakes/${bakeId}/steps/${stepId}/parameter-values/${parameterValueId}/planned`,
        { plannedValue }
      );
      // Update the specific parameter value within the currentBake and activeBakes
      set(state => {
        const updateParamInStep = (step: BakeStep) => {
          // Ensure parameterValues exists before mapping
          const newParameterValues = step.parameterValues?.map(pv => pv.id === parameterValueId ? response.data : pv) || [];
          return { ...step, parameterValues: newParameterValues};
        };

        const newCurrentBake = state.currentBake?.id === bakeId && state.currentBake.steps
          ? {
              ...state.currentBake,
              steps: state.currentBake.steps.map(s => s.id === stepId ? updateParamInStep(s) : s)
            }
          : state.currentBake;

        const newActiveBakes = state.activeBakes.map(b =>
          b.id === bakeId && b.steps
            ? { ...b, steps: b.steps.map(s => s.id === stepId ? updateParamInStep(s) : s) } 
            : b
        );

        return { currentBake: newCurrentBake, activeBakes: newActiveBakes, isLoading: false };
      });
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to update planned parameter value.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) { message = axiosError.response.data.message; }
      else if (axiosError.message) { message = axiosError.message; }
      console.error(`Failed to update planned parameter value for bake ${bakeId}, step ${stepId}:`, err);
      set({ error: message, isLoading: false });
      return null;
    }
  }
}));
