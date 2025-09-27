import React from 'react';
import { RunProvider, useRun, RUN_STATES } from '../context/RunContext';
import { PreRunScreen, ActiveRunScreen, RunSummaryScreen } from '../components';

/**
 * RunTab Component - GPS-Based Running Activity Tracker
 *
 * Complete run tracking system with three main states:
 * 1. Pre-Run: Setup, goals, and start button
 * 2. Active Run: Live GPS tracking with pause/resume
 * 3. Run Summary: Post-run statistics and achievements
 *
 * Features:
 * - High-accuracy GPS tracking
 * - Real-time metrics (distance, pace, time, calories)
 * - Goal setting and progress tracking
 * - Pause/resume functionality
 * - Run completion with detailed summary
 * - Achievement system integration
 *
 * Part of the nested tab navigation within HomeScreen.
 * Uses Aura Health design system throughout.
 */

// Main RunTab component that handles state routing
function RunTabContent() {
  const { status } = useRun();

  // Route to appropriate screen based on run status
  switch (status) {
    case RUN_STATES.IDLE:
      return <PreRunScreen />;

    case RUN_STATES.RUNNING:
    case RUN_STATES.PAUSED:
      return <ActiveRunScreen />;

    case RUN_STATES.COMPLETED:
      return <RunSummaryScreen />;

    default:
      return <PreRunScreen />;
  }
}

// Wrapper component with RunProvider
export default function RunTab() {
  return (
    <RunProvider>
      <RunTabContent />
    </RunProvider>
  );
}

