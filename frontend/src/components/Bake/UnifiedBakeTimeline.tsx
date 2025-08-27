// UnifiedBakeTimeline.tsx - Combined timeline and step descriptions for active bakes

import React, { useState, useEffect, useMemo } from 'react';
import { BakeTimingManager, type BakeTimeline, type BakeTimingEvent } from '../../utils/bakeTimingUtils';
import { useAlarmNotifications } from '../Recipe/TimingSchedule';
import { useBakeStore } from '../../store/useBakeStore';
import { useToast } from '../../context/ToastContext';
import type { BakeStep } from '../../types/bake';
import type { CalculatedStepColumn } from '../../hooks/useRecipeCalculations';

interface UnifiedBakeTimelineProps {
  bakeSteps: BakeStep[];
  bakeStartTime: Date;
  bakeId: number;
  stepCalculationsMap: Map<number, CalculatedStepColumn>;
  className?: string;
}

interface StepWithEvents {
  step: BakeStep;
  events: BakeTimingEvent[];
  calculations?: CalculatedStepColumn;
  nextEvent?: BakeTimingEvent;
  isActive: boolean;
  completedEvents: number;
  totalEvents: number;
}

export const UnifiedBakeTimeline: React.FC<UnifiedBakeTimelineProps> = ({
  bakeSteps,
  bakeStartTime,
  bakeId,
  stepCalculationsMap,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [autoStartEnabled, setAutoStartEnabled] = useState(true); // User preference for auto-start
  const { scheduleNotification } = useAlarmNotifications();
  const { startStep, completeStep, skipStep, isLoading: isStoreLoading } = useBakeStore();
  const { showToast } = useToast();

  // Generate complete timeline
  const timeline = useMemo(() => {
    return BakeTimingManager.generateBakeTimeline(bakeSteps, bakeStartTime);
  }, [bakeSteps, bakeStartTime]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Group events by step and add metadata
  const stepsWithEvents = useMemo((): StepWithEvents[] => {
    return bakeSteps.map(step => {
      const stepEvents = timeline.events.filter(event => 
        event.stepId === step.id || 
        (event.originalEvent?.description?.toLowerCase().includes(step.recipeStep?.stepTemplate?.name?.toLowerCase() || ''))
      );
      
      const completedEvents = stepEvents.filter(e => e.status === 'completed').length;
      const nextEvent = stepEvents.find(e => e.status === 'pending');
      const isActive = step.status === 'IN_PROGRESS' || Boolean(nextEvent?.scheduledTime && nextEvent.scheduledTime <= currentTime);
      
      return {
        step,
        events: stepEvents,
        calculations: step.recipeStepId ? stepCalculationsMap.get(step.recipeStepId) : undefined,
        nextEvent,
        isActive,
        completedEvents,
        totalEvents: stepEvents.length
      };
    });
  }, [bakeSteps, timeline.events, stepCalculationsMap, currentTime]);

  // Helper function to determine if a step can be started
  const canStartStep = (stepToStart: BakeStep, allSteps: BakeStep[]): { canStart: boolean; reason?: string } => {
    // If step is already in progress or completed, it can't be started again
    if (stepToStart.status !== 'PENDING') {
      return { canStart: false, reason: 'Step already started or completed' };
    }

    // Get step template name for logic decisions
    const stepName = stepToStart.recipeStep?.stepTemplate?.name?.toLowerCase() || '';
    
    // Find all previous steps (lower order numbers)
    const previousSteps = allSteps.filter(s => s.order < stepToStart.order);
    
    // Core sequential steps that must follow strict order
    const coreSteps = ['autolyse', 'mix', 'bulk ferment', 'pre-shape', 'shape', 'final proof', 'bake'];
    const isCoreStep = coreSteps.some(core => stepName.includes(core));
    
    if (isCoreStep) {
      // For core steps, previous core steps must be completed
      const incompletePreviousCoreSteps = previousSteps.filter(prevStep => {
        const prevStepName = prevStep.recipeStep?.stepTemplate?.name?.toLowerCase() || '';
        const isPrevCore = coreSteps.some(core => prevStepName.includes(core));
        return isPrevCore && prevStep.status !== 'COMPLETED' && prevStep.status !== 'SKIPPED';
      });
      
      if (incompletePreviousCoreSteps.length > 0) {
        const stepNames = incompletePreviousCoreSteps.map(s => s.recipeStep?.stepTemplate?.name).join(', ');
        return { 
          canStart: false, 
          reason: `Complete previous steps first: ${stepNames}` 
        };
      }
    }

    // Parallel/preparation steps can start if no dependencies
    const preparationSteps = ['starter', 'preferment', 'mise en place', 'preheat'];
    const isPreparationStep = preparationSteps.some(prep => stepName.includes(prep));
    
    if (isPreparationStep) {
      // Preparation steps can generally start early, but check for specific dependencies
      if (stepName.includes('preheat') || stepName.includes('oven')) {
        // Oven preheat should only start during final proof or later
        const shapingComplete = allSteps.some(s => 
          (s.recipeStep?.stepTemplate?.name?.toLowerCase().includes('shape') || 
           s.recipeStep?.stepTemplate?.name?.toLowerCase().includes('final proof')) && 
          s.status === 'COMPLETED'
        );
        if (!shapingComplete) {
          return { 
            canStart: false, 
            reason: 'Start oven preheat during final proof or later' 
          };
        }
      }
    }

    return { canStart: true };
  };

  const toggleStepExpansion = (stepId: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const handleStepAction = async (action: 'start' | 'complete' | 'skip', step: BakeStep) => {
    if (isStoreLoading) return;
    
    let result;
    const stepName = step.recipeStep?.stepTemplate?.name || 'Step';
    
    try {
      switch (action) {
        case 'start':
          result = await startStep(bakeId, step.id);
          if (result) {
            showToast(`${stepName} started`, { type: 'success' });
            // Auto-expand step when started
            setExpandedSteps(prev => new Set(prev).add(step.id));
          }
          break;
        case 'complete':
          result = await completeStep(bakeId, step.id, {});
          if (result) {
            showToast(`${stepName} completed`, { type: 'success' });
            // Check if next step should auto-start
            await handleAutoStartNextStep(step);
          }
          break;
        case 'skip':
          result = await skipStep(bakeId, step.id);
          if (result) {
            showToast(`${stepName} skipped`, { type: 'info' });
            // Check if next step should auto-start after skipping
            await handleAutoStartNextStep(step);
          }
          break;
      }
    } catch (error) {
      showToast(`Failed to ${action} ${stepName}`, { type: 'error' });
    }
  };

  // Auto-start logic for sourdough-specific workflow
  const handleAutoStartNextStep = async (completedStep: BakeStep) => {
    // Only auto-start if the feature is enabled
    if (!autoStartEnabled) return;
    
    const completedStepName = completedStep.recipeStep?.stepTemplate?.name?.toLowerCase() || '';
    
    // Find the next step in order
    const nextStep = bakeSteps.find(s => 
      s.order === completedStep.order + 1 && 
      s.status === 'PENDING'
    );
    
    if (!nextStep) return; // No next step to start
    
    const nextStepName = nextStep.recipeStep?.stepTemplate?.name?.toLowerCase() || '';
    
    // Auto-start rules for sourdough baking
    const autoStartRules = {
      // Immediate transitions that should auto-start
      'autolyse': () => nextStepName.includes('mix'),
      'mix': () => nextStepName.includes('bulk ferment') || nextStepName.includes('bulk'),
      
      // Steps that should NOT auto-start (require baker judgment)
      'bulk ferment': () => false, // Baker needs to check dough development
      'bulk': () => false,
      'pre-shape': () => false, // Baker needs to assess dough
      'shape': () => false, // Baker controls timing
      'final proof': () => false, // Baker judges proofing
      'proof': () => false,
      
      // Preparation steps can auto-start if they're next
      'mise en place': () => true,
      'preferment': () => false, // Usually prepared much earlier
      'starter': () => false, // Usually prepared much earlier
    };
    
    // Check if this step should auto-start the next one
    const shouldAutoStart = Object.entries(autoStartRules).some(([stepType, rule]) => {
      if (completedStepName.includes(stepType)) {
        return rule();
      }
      return false;
    });
    
    if (shouldAutoStart) {
      // Verify the next step can actually be started (check dependencies)
      const stepCanStart = canStartStep(nextStep, bakeSteps);
      
      if (stepCanStart.canStart) {
        try {
          const result = await startStep(bakeId, nextStep.id);
          if (result) {
            const nextStepDisplayName = nextStep.recipeStep?.stepTemplate?.name || 'Next Step';
            showToast(`${nextStepDisplayName} auto-started`, { 
              type: 'success',
              duration: 4000 // Longer duration for auto-start notifications
            });
            // Auto-expand the newly started step
            setExpandedSteps(prev => new Set(prev).add(nextStep.id));
          }
        } catch (error) {
          // Silent failure for auto-start - don't overwhelm user with error
          console.log('Auto-start failed for next step:', error);
        }
      }
    }
  };

  const getStepStatusColor = (step: BakeStep, isActive: boolean): string => {
    switch (step.status) {
      case 'COMPLETED': return 'border-success-500 bg-success-50';
      case 'IN_PROGRESS': return 'border-primary-500 bg-primary-50';
      case 'SKIPPED': return 'border-text-tertiary bg-surface-subtle';
      default: return isActive ? 'border-accent-500 bg-accent-50' : 'border-border bg-surface';
    }
  };

  const getEventIcon = (event: BakeTimingEvent): string => {
    switch (event.type) {
      case 'step-start': return '▶️';
      case 'step-complete': return '✅';
      case 'fold': return '🔄';
      case 'alarm': return '⏰';
      case 'milestone': return '📌';
      default: return '📌';
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Calculate remaining time for a step in progress
  const getStepCountdown = (step: BakeStep, events: BakeTimingEvent[]): string | null => {
    if (step.status !== 'IN_PROGRESS') return null;
    
    // Find the next event for this step that hasn't been completed
    const nextEvent = events.find(event => 
      event.stepId === step.id && 
      event.status === 'pending' && 
      event.scheduledTime > currentTime
    );
    
    if (!nextEvent) return null;
    
    const timeRemaining = nextEvent.scheduledTime.getTime() - currentTime.getTime();
    const minutesRemaining = Math.max(0, Math.ceil(timeRemaining / 60000));
    
    if (minutesRemaining === 0) return 'Due now';
    if (minutesRemaining < 60) return `${minutesRemaining}m left`;
    
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
  };

  // Calculate timeline overview data
  const overdueEvents = BakeTimingManager.getOverdueEvents(timeline);
  const timeUntilNext = BakeTimingManager.getTimeUntilNextEvent(timeline);
  
  // Find the current step in progress for dashboard display
  const currentStepInProgress = stepsWithEvents.find(stepData => stepData.step.status === 'IN_PROGRESS');
  const currentStepCountdown = currentStepInProgress ? getStepCountdown(currentStepInProgress.step, currentStepInProgress.events) : null;

  return (
    <div className={`unified-bake-timeline space-y-6 ${className}`}>
      {/* Baker Dashboard - Key Metrics */}
      <div className="baker-dashboard bg-surface-elevated rounded-lg p-4 border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-3 text-text-primary">🥖 Bake Status</h3>
        
        {/* Current Step Countdown - Prominent Display */}
        {currentStepInProgress && currentStepCountdown && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary-800">
                  Current: {currentStepInProgress.step.recipeStep?.stepTemplate?.name}
                </h4>
                <p className="text-sm text-primary-600">Step {currentStepInProgress.step.order} in progress</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">⏱️ {currentStepCountdown}</div>
                <p className="text-xs text-primary-600">until next event</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-surface rounded p-2 text-center border border-border-subtle">
            <div className="font-medium text-text-secondary">Progress</div>
            <div className="text-lg font-semibold text-text-primary">
              {stepsWithEvents.filter(s => s.step.status === 'COMPLETED').length}/{stepsWithEvents.length}
            </div>
          </div>
          <div className="bg-surface rounded p-2 text-center border border-border-subtle">
            <div className="font-medium text-text-secondary">Active Steps</div>
            <div className="text-lg font-semibold text-primary-600">
              {stepsWithEvents.filter(s => s.step.status === 'IN_PROGRESS').length}
            </div>
          </div>
          <div className="bg-surface rounded p-2 text-center border border-border-subtle">
            <div className="font-medium text-text-secondary">Next Event</div>
            <div className="text-sm font-medium text-text-primary">
              {timeUntilNext ? `${Math.round(timeUntilNext / 60000)}m` : 'None'}
            </div>
          </div>
          <div className="bg-surface rounded p-2 text-center border border-border-subtle">
            <div className="font-medium text-text-secondary">Alerts</div>
            <div className="text-lg font-semibold text-danger-600">
              {overdueEvents.length}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button 
            className="quick-action-btn bg-primary-500 text-white px-3 py-1 rounded text-sm hover:bg-primary-600 transition-colors"
            onClick={() => setCurrentTime(new Date())}
          >
            🔄 Refresh
          </button>
          <button 
            className="quick-action-btn bg-success-500 text-white px-3 py-1 rounded text-sm hover:bg-success-600 transition-colors"
            onClick={() => {/* Add temperature logging */}}
          >
            🌡️ Log Temp
          </button>
          <button 
            className="quick-action-btn bg-secondary-500 text-white px-3 py-1 rounded text-sm hover:bg-secondary-600 transition-colors"
            onClick={() => {/* Add fold counter */}}
          >
            ✋ Record Fold
          </button>
          <button 
            className={`quick-action-btn px-3 py-1 rounded text-sm transition-colors ${
              autoStartEnabled 
                ? 'bg-accent-500 text-white hover:bg-accent-600' 
                : 'bg-text-tertiary text-white hover:bg-text-secondary'
            }`}
            onClick={() => setAutoStartEnabled(!autoStartEnabled)}
            title={autoStartEnabled ? 'Auto-start is ON - steps will start automatically when appropriate' : 'Auto-start is OFF - you must start each step manually'}
          >
            {autoStartEnabled ? '⚡ Auto-Start ON' : '⏸️ Auto-Start OFF'}
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="steps-list space-y-4">
        {stepsWithEvents.map((stepData) => {
          const { step, events, calculations, nextEvent, isActive, completedEvents, totalEvents } = stepData;
          const isExpanded = expandedSteps.has(step.id);
          const stepCanStart = canStartStep(step, bakeSteps);
          const countdown = getStepCountdown(step, events);
          
          return (
            <div
              key={step.id}
              className={`step-card border-2 rounded-lg p-4 transition-colors ${getStepStatusColor(step, isActive)}`}
            >
              {/* Step Header */}
              <div className="step-header flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleStepExpansion(step.id)}
                    className="expand-toggle text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      {step.order}. {step.recipeStep?.stepTemplate?.name || 'Unknown Step'}
                      {countdown && (
                        <span className="ml-2 text-sm font-normal text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-200">
                          ⏱️ {countdown}
                        </span>
                      )}
                    </h4>
                    <div className="text-sm text-text-secondary">
                      Status: <span className="capitalize font-medium">{step.status}</span>
                      {events.length > 0 && (
                        <span className="ml-2">
                          Events: {completedEvents}/{totalEvents}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step Action Buttons */}
                <div className="step-actions flex space-x-2">
                  {step.status === 'PENDING' && (
                    <button
                      onClick={() => handleStepAction('start', step)}
                      disabled={!stepCanStart.canStart || isStoreLoading}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        stepCanStart.canStart 
                          ? 'bg-success-500 text-white hover:bg-success-600' 
                          : 'bg-surface-subtle text-text-tertiary cursor-not-allowed border border-border'
                      }`}
                      title={stepCanStart.reason}
                    >
                      Start
                    </button>
                  )}
                  {step.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={() => handleStepAction('complete', step)}
                        disabled={isStoreLoading}
                        className="bg-primary-500 text-white px-3 py-1 rounded text-sm hover:bg-primary-600 transition-colors"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStepAction('skip', step)}
                        disabled={isStoreLoading}
                        className="bg-text-secondary text-white px-3 py-1 rounded text-sm hover:bg-text-primary transition-colors"
                      >
                        Skip
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Next Event Preview */}
              {nextEvent && (
                <div className="next-event bg-warning-50 border border-warning-200 rounded p-2 mb-2">
                  <div className="text-sm">
                    <span className="font-medium text-text-primary">Next: </span>
                    {getEventIcon(nextEvent)} {nextEvent.description}
                    <span className="ml-2 text-text-secondary">
                      at {nextEvent.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              {/* Step Details (Expandable) */}
              {isExpanded && (
                <div className="step-details mt-3 space-y-3">
                  {/* Step Details (Expandable) */}
                  {step.recipeStep?.stepTemplate?.name && (
                    <div className="step-description bg-surface rounded p-3 border border-border-subtle">
                      <h5 className="font-medium mb-2 text-text-primary">Step: {step.recipeStep.stepTemplate.name}</h5>
                      <p className="text-sm text-text-secondary">
                        Step details and instructions would appear here.
                      </p>
                    </div>
                  )}

                  {/* Step Parameters/Calculations */}
                  {calculations && (
                    <div className="step-calculations bg-surface rounded p-3 border border-border-subtle">
                      <h5 className="font-medium mb-2 text-text-primary">Measurements</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Total Weight</span>
                          <span className="font-medium text-text-primary">{calculations.totalWeight}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Water Weight</span>
                          <span className="font-medium text-text-primary">{calculations.waterWeight}g</span>
                        </div>
                        {calculations.flourComponents.map((flour, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="text-text-secondary">{flour.name}</span>
                            <span className="font-medium text-text-primary">{flour.weight}g</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events Timeline */}
                  {events.length > 0 && (
                    <div className="events-timeline bg-surface rounded p-3 border border-border-subtle">
                      <h5 className="font-medium mb-2 text-text-primary">Timeline</h5>
                      <div className="space-y-2">
                        {events.map((event, idx) => (
                          <div
                            key={idx}
                            className={`event-item flex items-center space-x-3 p-2 rounded transition-colors ${
                              event.status === 'completed' ? 'bg-success-50 border border-success-200' : 
                              event.status === 'active' ? 'bg-primary-50 border border-primary-200' : 'bg-surface-subtle border border-border-subtle'
                            }`}
                          >
                            <span className="text-lg">{getEventIcon(event)}</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-text-primary">{event.description}</div>
                              <div className="text-xs text-text-secondary">
                                {event.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div className={`status-indicator w-3 h-3 rounded-full ${
                              event.status === 'completed' ? 'bg-success-500' :
                              event.status === 'active' ? 'bg-primary-500' : 'bg-text-tertiary'
                            }`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Baker Notes Section */}
                  <div className="baker-notes bg-white rounded p-3">
                    <h5 className="font-medium mb-2">Baker Notes</h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <span>🌡️ Dough Temp:</span>
                        <input 
                          type="text" 
                          placeholder="°F" 
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                        <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Log</button>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span>✋ Folds:</span>
                        <div className="fold-counter flex space-x-1">
                          {[1,2,3,4].map(fold => (
                            <button 
                              key={fold}
                              className="w-6 h-6 border rounded text-xs hover:bg-gray-100"
                            >
                              {fold}
                            </button>
                          ))}
                        </div>
                        <button className="bg-green-500 text-white px-2 py-1 rounded text-xs">Reset</button>
                      </div>
                      <div className="text-sm">
                        <textarea 
                          placeholder="Notes for this step..."
                          className="w-full px-2 py-1 border rounded text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dependency Warning */}
              {step.status === 'PENDING' && !stepCanStart.canStart && (
                <div className="dependency-warning mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  ⚠️ {stepCanStart.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Action Buttons */}
      <div className="floating-actions fixed bottom-6 right-6 flex flex-col space-y-2">
        <button 
          className="fab bg-red-500 text-white w-12 h-12 rounded-full shadow-lg hover:bg-red-600 flex items-center justify-center"
          onClick={() => {/* Emergency timer */}}
          title="Emergency Timer"
        >
          ⏰
        </button>
        <button 
          className="fab bg-blue-500 text-white w-12 h-12 rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center"
          onClick={() => {/* Quick note */}}
          title="Quick Note"
        >
          📝
        </button>
      </div>
    </div>
  );
};

export default UnifiedBakeTimeline;
