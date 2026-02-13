import {
  Bell,
  Calendar,
  Heart,
  HelpCircle,
  MessageCircle,
  User,
  type LucideIcon,
} from "lucide-react";

export interface GuestUserMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const guestUserMenuItems: GuestUserMenuItem[] = [
  { label: "Profile", href: "/guest/profile", icon: User },
  { label: "Bookings", href: "/guest/bookings", icon: Calendar },
  { label: "Messages", href: "/guest/messages", icon: MessageCircle },
  { label: "Favourites", href: "/guest/favorites", icon: Heart },
  { label: "Notifications", href: "/guest/notifications", icon: Bell },
  { label: "Help & Support", href: "/help", icon: HelpCircle },
];
