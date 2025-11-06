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
  const [editEmail, setEditEmail] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactAddress, setNewContactAddress] = useState("");
  const [newContactNote, setNewContactNote] = useState("");
  
  // Inline note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNote, setEditNote] = useState("");

  const handleAddContact = async () => {
    if (!newContactEmail.trim() || !newContactAddress.trim()) {
      toast.error("Please fill in email and address fields");
      return;
    }
    
    await createContactMutation.mutateAsync({
      name: newContactName.trim() || undefined,
      email: newContactEmail.trim(),
      address: newContactAddress.trim(),
      note: newContactNote || undefined,
    });
    
    setNewContactName("");
    setNewContactEmail("");
    setNewContactAddress("");
    setNewContactNote("");
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    await deleteContactMutation.mutateAsync(id);
    setSelectedContact(null);
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
    setEditEmail(contact.email);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedContact) return;
    
    if (!editName.trim() || !editEmail.trim()) {
      toast.error("Name and email cannot be empty");
      return;
    }

    const updated = await updateContactMutation.mutateAsync({
      id: selectedContact.id,
      data: {
        name: editName.trim(),
        email: editEmail.trim(),
      },
    });
    
    setSelectedContact(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName("");
    setEditEmail("");
  };

  // Inline note editing functions
  const handleStartEditNote = () => {
    if (!selectedContact) return;
    setEditNote(selectedContact.note || "");
    setIsEditingNote(true);
  };

  const handleSaveNote = async () => {
    if (!selectedContact) return;
    
    try {
      const updated = await updateContactMutation.mutateAsync({
        id: selectedContact.id,
        data: {
          note: editNote.trim() || undefined,
        },
      });
      
      setSelectedContact(updated);
      setIsEditingNote(false);
      setEditNote("");
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleCancelEditNote = () => {
    setIsEditingNote(false);
    setEditNote("");
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNote();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditNote();
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

        return (
          <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-white" />
            <h2 className="text-white text-xl font-semibold">Contacts</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/20 text-white bg-white/10"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
        <p className="text-gray-400 text-sm">Manage saved wallet addresses</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 pr-4 py-2.5 bg-transparent border-0 border-b border-white/10 rounded-none text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
        />
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
            <Input
              placeholder="Contact name (optional)"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
            <Input
              placeholder="Email address *"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              type="email"
            />
            <Input
              placeholder="Wallet address (0x...) *"
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
            <Input
              placeholder="Note (optional)"
              value={newContactNote}
              onChange={(e) => setNewContactNote(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-white text-black hover:bg-gray-200"
                onClick={handleAddContact}
                disabled={createContactMutation.isPending}
              >
                {createContactMutation.isPending ? "Adding..." : "Add"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
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
          <Separator className="bg-white/10" />
        </>
      )}

             {/* Contacts List */}
             <ScrollArea className="h-[calc(100vh-350px)]">
               <div className="space-y-6" style={{ gap: '24px' }}>
          {isLoading ? (
            <div className="text-left py-12 text-gray-400">
              <Users className="h-12 w-12 mb-3 opacity-50 animate-pulse" />
              <p className="text-white font-medium">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-left py-12 text-gray-400">
              <Users className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-white font-medium">No contacts found</p>
              <p className="text-sm text-gray-400">Try adjusting your search</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setIsEditingNote(false);
                  setEditNote("");
                }}
                className="w-full bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white mb-1">
                      {contact.name || 'Unnamed Contact'}
                    </p>
                    <p className="text-xs text-gray-400 mb-1">{contact.email}</p>
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
      <Dialog open={!!selectedContact}         onOpenChange={(open) => {
        if (!open) {
          setSelectedContact(null);
          setIsEditing(false);
          setIsEditingNote(false);
          setEditNote("");
        }
      }}>
        <DialogContent className="bg-[rgba(20,0,35,0.95)] border-white/10">
          {selectedContact && (
            <div className="bg-transparent text-white rounded-lg -m-6 max-h-[85vh] min-h-[400px] flex flex-col">
              {/* Fixed Header */}
              <div className="p-6 pb-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white text-xl font-semibold mb-1">{selectedContact.name}</h3>
                    <p className="text-gray-400 text-sm">Contact details and actions</p>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-white hover:bg-white/10"
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
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Name</p>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                        <Input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                          type="email"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-white text-black hover:bg-gray-200"
                        onClick={handleSaveEdit}
                        disabled={updateContactMutation.isPending}
                      >
                        {updateContactMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    {/* Delete Button in Edit Mode */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDelete(selectedContact.id)}
                      disabled={deleteContactMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleteContactMutation.isPending ? "Deleting..." : "Delete Contact"}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Note - Inline Editable */}
                    {isEditingNote ? (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          onKeyDown={handleNoteKeyDown}
                          onBlur={handleSaveNote}
                          className="w-full bg-transparent text-sm text-white resize-none border-none outline-none focus:ring-0 p-0 placeholder:text-gray-400"
                          rows={3}
                          autoFocus
                          placeholder="Add a note..."
                        />
                      </div>
                    ) : (
                      <div 
                        className="bg-white/5 border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={handleStartEditNote}
                      >
                        {selectedContact.note ? (
                          <p className="text-sm text-white whitespace-pre-wrap">{selectedContact.note}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Click to add a note...</p>
                        )}
                      </div>
                    )}

                    {/* Email */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center gap-2">
                          <code className="text-sm flex-1 text-white font-mono">{selectedContact.email}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 hover:bg-white/10 text-white"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedContact.email);
                              toast.success("Email copied");
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Wallet Address</p>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center gap-2">
                          <code className="text-sm break-all flex-1 text-white font-mono">{selectedContact.address}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 hover:bg-white/10 text-white"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedContact.address);
                              toast.success("Address copied");
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button
                        className="w-full gap-2 bg-white text-black hover:bg-gray-200"
                        onClick={() => handleSendTo(selectedContact)}
                      >
                        <Send className="h-4 w-4" />
                        Send to {selectedContact.name}
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
