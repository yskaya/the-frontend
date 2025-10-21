import { api } from '@/lib';
import { Contact } from './contacts.types';

/**
 * Request/Response types (API-specific)
 */
export interface CreateContactRequest {
  name: string;
  address: string;
  note?: string;
}

export interface UpdateContactRequest {
  name?: string;
  note?: string;
}

/**
 * Get all contacts
 */
export const getContacts = async (): Promise<Contact[]> => {
  const response = await api.get<Contact[]>('http://localhost:5005/api/contacts');
  return response.data || [];
};

/**
 * Create a new contact
 */
export const createContact = async (data: CreateContactRequest): Promise<Contact> => {
  const response = await api.post<Contact>('http://localhost:5005/api/contacts', data);
  if (!response.data) {
    throw new Error('Failed to create contact');
  }
  return response.data;
};

/**
 * Update a contact
 */
export const updateContact = async (id: string, data: UpdateContactRequest): Promise<Contact> => {
  const response = await api.patch<Contact>(`http://localhost:5005/api/contacts/${id}`, data);
  if (!response.data) {
    throw new Error('Failed to update contact');
  }
  return response.data;
};

/**
 * Delete a contact
 */
export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`http://localhost:5005/api/contacts/${id}`);
  return;
};
