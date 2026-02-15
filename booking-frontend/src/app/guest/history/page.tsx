import { redirect } from "next/navigation";

export default function GuestHistoryRedirectPage() {
  redirect("/guest/bookings");
}
