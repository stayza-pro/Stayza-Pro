import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Root page router - server-side redirects for SEO
export default function RootPage() {
  const headersList = headers();
  const tenantType = headersList.get("x-tenant-type") || "main";

  // Admin subdomain -> admin login (server-side redirect)
  if (tenantType === "admin") {
    redirect("/admin/login");
  }

  // All other domains -> marketing site (server-side redirect)
  redirect("/en");
}
