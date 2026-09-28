import type { Metadata } from "next";
import { AdminContacts } from "@/components/admin/AdminContacts";

export const metadata: Metadata = { title: "Admin · Emergency contacts" };

export default function AdminContactsPage() {
  return <AdminContacts />;
}
