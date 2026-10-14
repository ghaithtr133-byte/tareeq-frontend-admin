import { redirect } from "next/navigation";

/**
 * There is no approved session endpoint or response contract yet. Treat every
 * visit as unauthenticated rather than exposing an unverified admin shell.
 */
export default function AdminIndexPage() {
  redirect("/admin/login");
}
