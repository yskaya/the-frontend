import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Contact } from './types';

// ============================================
// Action Types
// ============================================

type ContactsAction =
  | { type: 'SET_ALL'; payload: Contact[] }
  | { type: 'ADD'; payload: Contact }
  | { type: 'UPDATE'; payload: { id: string; contact: Contact } }
  | { type: 'REMOVE'; payload: string };

// ============================================
// Reducer (Centralized State Logic)
// ============================================

function contactsReducer(state: Contact[], action: ContactsAction): Contact[] {
  switch (action.type) {
    case 'SET_ALL':
      return action.payload;
    
    case 'ADD':
      return [...state, action.payload];
    
    case 'UPDATE':
      return state.map(c => 
        c.id === action.payload.id ? action.payload.contact : c
      );
    
    case 'REMOVE':
      return state.filter(c => c.id !== action.payload);
    
    default:
      return state;
  }
}

// ============================================
// Context (Public: Data Only)
// ============================================

interface ContactsContextType {
  contacts: Contact[];
}

export const ContactsContext = createContext<ContactsContextType>({
  contacts: [],
});

export const useContactsContext = () => useContext(ContactsContext);

// ============================================
// Dispatch Context (Internal: Not Exported)
// ============================================

interface ContactsDispatchContextType {
  dispatch: React.Dispatch<ContactsAction>;
}

const ContactsDispatchContext = createContext<ContactsDispatchContextType>({} as ContactsDispatchContextType);

// Internal hook - only used by useContacts.ts
export const useContactsDispatch = () => useContext(ContactsDispatchContext);

// ============================================
// Provider Component
// ============================================

/**
 * ContactsProvider
 * Manages contacts state globally with reducer pattern
 * 
 * Architecture:
 * - Public Context: Only exposes { contacts } data
 * - Internal Context: Exposes { dispatch } for hooks
 * - Reducer: Centralized switch() for all state updates
 */
export const ContactsProvider = ({ children }: { children: ReactNode }) => {
  const [contacts, dispatch] = useReducer(contactsReducer, []);

  return (
    <ContactsContext.Provider value={{ contacts }}>
      <ContactsDispatchContext.Provider value={{ dispatch }}>
        {children}
      </ContactsDispatchContext.Provider>
    </ContactsContext.Provider>
  );
};
