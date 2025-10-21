// Shared Types
export type { Contact } from './contacts.types';

// API (includes request/response types)
export * from './contacts.api';

// React Query Hooks
export * from './useContacts';

// Context Provider
export { ContactsProvider, useContactsContext } from './ContactsProvider';

// Components
export { ContactsPanel } from './ContactsPanel';
