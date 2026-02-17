import { redirect } from "next/navigation";
import { getSubdomainInfoServer } from "@/utils/subdomain-server";

// Root page router - server-side redirects for SEO
export default function RootPage() {
  const tenantInfo = getSubdomainInfoServer();

  // Admin subdomain -> admin login (server-side redirect)
  if (tenantInfo.type === "admin") {
    redirect("/admin/login");
  }

  // Realtor subdomain -> branded guest landing page
  if (tenantInfo.type === "realtor") {
    redirect("/guest-landing");
  }

  // All other domains -> marketing site (server-side redirect)
  redirect("/en");
}
