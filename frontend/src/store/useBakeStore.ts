import { create } from 'zustand';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Bake, BakeStep, BakeStepParameterValue } from '../types/bake';
import api from '../utils/api'; // Your existing Axios instance

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
    set({ isLoading: true, error: null });
    try {
      // Attempt to find in activeBakes first for a quicker load if already present
      let bake = get().activeBakes.find(b => b.id === bakeId);

      if (!bake) { // If not found in activeBakes, fetch from the API
        const response = await api.get<Bake>(`/bakes/${bakeId}`);
        bake = response.data;
      } else {
        console.log(`Bake ${bakeId} found in activeBakes list. Using cached version. Consider fetching if freshness is critical.`);
      }
      set({ currentBake: bake || null, isLoading: false });
      return bake || null;
    } catch (err: unknown) {
      let message = `Failed to fetch bake ${bakeId}.`;
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      console.error(`Failed to fetch bake ${bakeId}:`, err);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  startBake: async (recipeId: number, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<Bake>('/bakes', { recipeId, notes });
      set(state => ({
        activeBakes: [...state.activeBakes, response.data],
        currentBake: response.data, // Optionally set as current bake
        isLoading: false,
      }));
      return response.data;
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
      set({ error: message, isLoading: false });
      return null;
    }
  },

  completeBake: async (bakeId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<Bake>(`/bakes/${bakeId}/complete`);
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
      set({ error: message, isLoading: false });
      return null;
    }
  },

  _updateStepInState: (updatedStep: BakeStep) => {
    set(state => {
      const newCurrentBake = state.currentBake
        ? {
            ...state.currentBake, // Ensure steps exists before mapping
            steps: state.currentBake.steps ? state.currentBake.steps.map(s => s.id === updatedStep.id ? updatedStep : s) : [],
          }
        : null;
      const newActiveBakes = state.activeBakes.map(b =>
        b.id === updatedStep.bakeId
          ? { ...b, steps: b.steps ? b.steps.map(s => s.id === updatedStep.id ? updatedStep : s) : [] }
          : b
      );
      return { currentBake: newCurrentBake, activeBakes: newActiveBakes, isLoading: false };
    });
  },

  startStep: async (bakeId: number, stepId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<BakeStep>(`/bakes/${bakeId}/steps/${stepId}/start`);
      get()._updateStepInState(response.data);
      return response.data;
    } catch (err: unknown) {
      let message = 'Failed to start step.';
      const axiosError = err as AxiosErrorWithMessage;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.message) {
        message = axiosError.message;
      }
      set({ error: message, isLoading: false });
      return null;
    }
  },

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
        const newCurrentBake = state.currentBake && state.currentBake.id === bakeId && state.currentBake.steps
          ? { 
              ...state.currentBake, 
              steps: state.currentBake.steps.map(s => 
                s.id === stepId ? { ...s, parameterValues: s.parameterValues.map((p: BakeStepParameterValue) => p.id === parameterValueId ? response.data : p) } : s
              ) 
            }
          : state.currentBake;
        // Similar update for activeBakes if needed, more complex
        return { currentBake: newCurrentBake, isLoading: false };
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
        const updateParamInStep = (step: BakeStep) => ({
          ...step,
          parameterValues: step.parameterValues.map(pv => pv.id === parameterValueId ? response.data : pv)
        });
        
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
      set({ error: message, isLoading: false });
      return null;
    }
  }
}));