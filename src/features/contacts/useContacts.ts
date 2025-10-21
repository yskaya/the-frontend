import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useContactsContext, useContactsDispatch } from './ContactsProvider';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  type CreateContactRequest,
  type UpdateContactRequest,
} from './contacts.api';
import { Contact } from './contacts.types';

/**
 * Get all contacts
 * Uses React Query for caching and auto-refetch
 */
export const useContacts = () => {
  const { contacts } = useContactsContext();
  const { dispatch } = useContactsDispatch();

  return useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const freshContacts = await getContacts();
      // Update context with fresh data
      dispatch({ type: 'SET_ALL', payload: freshContacts });
      return freshContacts;
    },
    // Use placeholder data from context for instant render while fetching
    placeholderData: contacts.length > 0 ? contacts : undefined,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });
};

/**
 * Create contact mutation
 */
export const useCreateContact = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useContactsDispatch();
  
  return useMutation<Contact, Error, CreateContactRequest, { optimisticContact: Contact }>({
    mutationFn: createContact,
    onMutate: async (newContactData) => {
      // Optimistic update: add to context immediately
      const optimisticContact: Contact = {
        id: `temp-${Date.now()}`,
        ...newContactData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD', payload: optimisticContact });
      return { optimisticContact };
    },
    onSuccess: (newContact, _, context) => {
      // Replace optimistic with real contact from API
      if (context?.optimisticContact) {
        dispatch({ type: 'REMOVE', payload: context.optimisticContact.id });
        dispatch({ type: 'ADD', payload: newContact });
      }
      
      toast.success(`Contact "${newContact.name}" added`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error, _, context) => {
      // Remove optimistic update on error
      if (context?.optimisticContact) {
        dispatch({ type: 'REMOVE', payload: context.optimisticContact.id });
      }
      toast.error("Failed to add contact", { description: error.message });
    },
  });
};

/**
 * Update contact mutation
 */
export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useContactsDispatch();
  
  return useMutation<Contact, Error, { id: string; data: UpdateContactRequest }>({
    mutationFn: ({ id, data }) => updateContact(id, data),
    onSuccess: (updatedContact) => {
      // Update context with new data from API
      dispatch({ 
        type: 'UPDATE', 
        payload: { id: updatedContact.id, contact: updatedContact } 
      });
      
      toast.success(`Contact "${updatedContact.name}" updated`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      toast.error("Failed to update contact", { description: error.message });
    },
  });
};

/**
 * Delete contact mutation
 */
export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useContactsDispatch();
  
  return useMutation<void, Error, string, { id: string }>({
    mutationFn: deleteContact,
    onMutate: async (id) => {
      // Optimistic update: remove from context immediately
      dispatch({ type: 'REMOVE', payload: id });
      return { id };
    },
    onSuccess: () => {
      toast.success("Contact deleted");
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      // On error, refetch to restore the contact
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.error("Failed to delete contact");
    },
  });
};
