import { api } from '@/lib';
import { Contact } from './contacts.types';

// Use environment variable with fallback
const CONTACTS_API_BASE = process.env.NEXT_PUBLIC_CONTACTS_API_URL || 'http://localhost:5005/api';

/**
 * Request/Response types (API-specific)
 */
export interface CreateContactRequest {
  name?: string;
  email: string;
  address: string;
  note?: string;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  note?: string;
}

/**
 * Get all contacts
 */
export const getContacts = async (): Promise<Contact[]> => {
  const response = await api.get<Contact[]>(`${CONTACTS_API_BASE}/contacts`);
  return response.data || [];
};

/**
 * Create a new contact
 */
export const createContact = async (data: CreateContactRequest): Promise<Contact> => {
  const response = await api.post<Contact>(`${CONTACTS_API_BASE}/contacts`, data);
  if (!response.data) {
    throw new Error('Failed to create contact');
  }
  return response.data;
};

/**
 * Update a contact
 */
export const updateContact = async (id: string, data: UpdateContactRequest): Promise<Contact> => {
  const response = await api.patch<Contact>(`${CONTACTS_API_BASE}/contacts/${id}`, data);
  if (!response.data) {
    throw new Error('Failed to update contact');
  }
  return response.data;
};

/**
 * Delete a contact
 */
export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`${CONTACTS_API_BASE}/contacts/${id}`);
  return;
};
