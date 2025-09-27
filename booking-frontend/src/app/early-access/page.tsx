import { redirect } from "next/navigation";

export default function EarlyAccessRedirect() {
  redirect("/get-started");
}
