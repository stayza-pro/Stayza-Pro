import { redirect } from "next/navigation";

export default function BecomeHostRedirectPage() {
  // Server-side redirect to realtor onboarding
  redirect("/realtor/onboarding");
}
