import type { Contact } from '@/features/contacts/contacts.types';

/**
 * Mock contacts data
 * Simulates backend database
 */
let mockContacts: Contact[] = [
  { 
    id: "1", 
    name: "Main Exchange", 
    address: "0x8f3d4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f", 
    note: "Primary trading account",
    createdAt: "2025-10-15T10:30:00Z",
    updatedAt: "2025-10-15T10:30:00Z"
  },
  { 
    id: "2", 
    name: "Backup Exchange", 
    address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", 
    createdAt: "2025-10-16T14:20:00Z",
    updatedAt: "2025-10-16T14:20:00Z"
  },
  { 
    id: "3", 
    name: "Hardware Wallet", 
    address: "0x7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c", 
    note: "Cold storage",
    createdAt: "2025-10-10T09:00:00Z",
    updatedAt: "2025-10-10T09:00:00Z"
  },
  { 
    id: "4", 
    name: "Alice", 
    address: "0x9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f", 
    createdAt: "2025-10-12T16:45:00Z",
    updatedAt: "2025-10-12T16:45:00Z"
  },
  { 
    id: "5", 
    name: "Bob", 
    address: "0x2f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a", 
    createdAt: "2025-10-13T11:30:00Z",
    updatedAt: "2025-10-13T11:30:00Z"
  },
  { 
    id: "6", 
    name: "Company Treasury", 
    address: "0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d", 
    createdAt: "2025-10-14T13:15:00Z",
    updatedAt: "2025-10-14T13:15:00Z"
  },
  { 
    id: "7", 
    name: "Quick Wallet", 
    address: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    createdAt: "2025-10-17T08:00:00Z",
    updatedAt: "2025-10-17T08:00:00Z"
  },
];

/**
 * Get all contacts
 */
export const getMockContacts = async (): Promise<Contact[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...mockContacts];
};

/**
 * Create contact
 */
export const createMockContact = async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newContact: Contact = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockContacts.push(newContact);
  return newContact;
};

/**
 * Update contact
 */
export const updateMockContact = async (id: string, data: Partial<Contact>): Promise<Contact> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const index = mockContacts.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error("Contact not found");
  }
  
  mockContacts[index] = {
    ...mockContacts[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  return mockContacts[index];
};

/**
 * Delete contact
 */
export const deleteMockContact = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const initialLength = mockContacts.length;
  mockContacts = mockContacts.filter(c => c.id !== id);
  
  if (mockContacts.length === initialLength) {
    throw new Error("Contact not found");
  }
};

