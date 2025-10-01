/**
 * Components Export Index
 *
 * Centralized export for all components.
 * Provides clean import paths: import { PetComponent } from '../components'
 */

// UI Components
export { default as PetComponent } from './ui/PetComponent';

// Food Components
export { default as BarcodeScanner } from './food/BarcodeScanner';

// Run Components
export { default as PreRunScreen } from './run/PreRunScreen';
export { default as ActiveRunScreen } from './run/ActiveRunScreen';
export { default as RunSummaryScreen } from './run/RunSummaryScreen';

// Gamification Components
export { default as BlindBoxModal } from './gamification/BlindBoxModal';