/**
 * Shared Contact Type
 * Used across components, hooks, and API
 */

export interface Contact {
  id: string;
  name: string;
  address: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
