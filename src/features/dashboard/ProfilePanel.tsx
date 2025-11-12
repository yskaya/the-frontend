import { useState } from "react";
import type { User } from "@/features/auth";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { Button } from "@/ui/button";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { ContactsPanel } from "@/features/contacts";
import { LogoutButton } from "@/components/LogoutButton";
import { Users, LogOut } from "lucide-react";

interface ProfilePanelProps {
  user: User;
  onSendTo: (address: string, name: string) => void;
}

export function ProfilePanel({ user, onSendTo }: ProfilePanelProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);

  return (
    <Sheet open={userMenuOpen} onOpenChange={setUserMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full p-0 hover:bg-white/10 ml-10"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-white/10 text-white border border-white/20">
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] min-w-[300px] bg-[rgba(20,0,35,0.95)] border-white/10">
        <div className="space-y-6 p-8">
          {/* User Info */}
          <div className="flex flex-col items-center gap-4 pt-8">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-white/10 text-white text-2xl border-2 border-white/20">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.email || 'User'
                }
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {user.email || ''}
              </p>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-white/10"></div>

          {/* Contacts Link */}
          <Sheet open={contactsOpen} onOpenChange={setContactsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-2 px-4 py-3 rounded-lg"
              >
                <Users className="h-4 w-4" />
                Contacts
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[500px] min-w-[300px] right-[500px] h-screen overflow-y-auto bg-[rgba(20,0,35,0.95)] border-white/10 p-0">
              <ContactsPanel onSendTo={onSendTo} />
            </SheetContent>
          </Sheet>

          {/* Separator */}
          <div className="border-t border-white/10"></div>

          {/* Actions */}
          <div className="space-y-2 flex justify-center">
            <LogoutButton 
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-2 px-4 py-3 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              Exit
            </LogoutButton>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

