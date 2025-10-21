import { useState } from "react";
import { Users, Plus, Trash2, Edit2, Search, Send, Copy } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Dialog, DialogContent } from "@/ui/dialog";
import { toast } from "sonner";
import { Separator } from "@/ui/separator";
import { ScrollArea } from "@/ui/scroll-area";
import { 
  useContacts, 
  useCreateContact, 
  useUpdateContact, 
  useDeleteContact,
  type Contact 
} from "@/features/contacts";

interface ContactsPanelProps {
  onSendTo?: (address: string, name: string) => void;
}

export function ContactsPanel({ onSendTo }: ContactsPanelProps) {
  // React Query hooks
  const { data: contacts = [], isLoading } = useContacts();
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  
  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactAddress, setNewContactAddress] = useState("");
  const [newContactNote, setNewContactNote] = useState("");

  const handleAddContact = async () => {
    if (!newContactName.trim() || !newContactAddress.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    await createContactMutation.mutateAsync({
      name: newContactName.trim(),
      address: newContactAddress.trim(),
      note: newContactNote || undefined,
    });
    
    setNewContactName("");
    setNewContactAddress("");
    setNewContactNote("");
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    await deleteContactMutation.mutateAsync(id);
    setSelectedContact(null);
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success("Name copied");
  };

  const handleSendTo = (contact: Contact) => {
    if (onSendTo) {
      onSendTo(contact.address, contact.name);
      setSelectedContact(null);
    } else {
      toast.info(`Opening send dialog for ${contact.name}`);
      setSelectedContact(null);
    }
  };

  const handleStartEdit = (contact: Contact) => {
    setEditName(contact.name);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedContact) return;
    
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    const updated = await updateContactMutation.mutateAsync({
      id: selectedContact.id,
      data: {
        name: editName.trim(),
      },
    });
    
    setSelectedContact(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName("");
  };

  // Filter contacts
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-black" />
          <h2 className="text-black text-xl font-semibold">Contacts</h2>
        </div>
        <p className="text-gray-600 text-sm">Manage saved wallet addresses</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-gray-50 border-gray-300 text-black placeholder:text-gray-400"
        />
      </div>

      {/* Add Contact Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 border-gray-300 text-black hover:bg-gray-100"
        onClick={() => setShowAddForm(!showAddForm)}
      >
        <Plus className="h-4 w-4" />
        Add Contact
      </Button>

      {/* Add Contact Form */}
      {showAddForm && (
        <>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
            <Input
              placeholder="Contact name *"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="bg-white border-gray-300 text-black placeholder:text-gray-400"
            />
            <Input
              placeholder="Wallet address (0x...) *"
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              className="bg-white border-gray-300 text-black placeholder:text-gray-400"
            />
            <Input
              placeholder="Note (optional)"
              value={newContactNote}
              onChange={(e) => setNewContactNote(e.target.value)}
              className="bg-white border-gray-300 text-black placeholder:text-gray-400"
            />
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-black text-white hover:bg-gray-800"
                onClick={handleAddContact}
                disabled={createContactMutation.isPending}
              >
                {createContactMutation.isPending ? "Adding..." : "Add"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-gray-300 text-black hover:bg-gray-100"
                onClick={() => {
                  setShowAddForm(false);
                  setNewContactName("");
                  setNewContactAddress("");
                  setNewContactNote("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
          <Separator className="bg-gray-200" />
        </>
      )}

      {/* Contacts List */}
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
              <p className="text-black font-medium">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-black font-medium">No contacts found</p>
              <p className="text-sm">Try adjusting your search</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="w-full bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black mb-1">{contact.name}</p>
                    <code className="text-xs text-gray-500 block truncate">
                      {contact.address.slice(0, 10)}...{contact.address.slice(-8)}
                    </code>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Contact Detail Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={(open) => {
        if (!open) {
          setSelectedContact(null);
          setIsEditing(false);
        }
      }}>
        <DialogContent>
          {selectedContact && (
            <div className="bg-white text-black rounded-lg -m-6 max-h-[85vh] min-h-[400px] flex flex-col">
              {/* Fixed Header */}
              <div className="p-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-black text-xl font-semibold mb-1">{selectedContact.name}</h3>
                    <p className="text-gray-600 text-sm">Contact details and actions</p>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-black hover:bg-gray-100"
                      onClick={() => handleStartEdit(selectedContact)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Edit Mode */}
                {isEditing ? (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-gray-50 border-gray-300 text-black"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                        onClick={handleSaveEdit}
                        disabled={updateContactMutation.isPending}
                      >
                        {updateContactMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-300 text-black hover:bg-gray-100"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Note */}
                    {selectedContact.note && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">{selectedContact.note}</p>
                      </div>
                    )}

                    {/* Address */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Wallet Address</p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <code className="text-sm break-all block text-black font-mono">{selectedContact.address}</code>
                      </div>
                    </div>

                    <Separator className="bg-gray-200" />

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button
                        className="w-full gap-2 bg-black text-white hover:bg-gray-800"
                        onClick={() => handleSendTo(selectedContact)}
                      >
                        <Send className="h-4 w-4" />
                        Send to {selectedContact.name}
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-gray-300 text-black hover:bg-gray-100"
                          onClick={() => handleCopyName(selectedContact.name)}
                        >
                          <Copy className="h-4 w-4" />
                          Copy Name
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-gray-300 text-black hover:bg-gray-100"
                          onClick={() => handleCopyAddress(selectedContact.address)}
                        >
                          <Copy className="h-4 w-4" />
                          Copy Address
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(selectedContact.id)}
                        disabled={deleteContactMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteContactMutation.isPending ? "Deleting..." : "Delete Contact"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
