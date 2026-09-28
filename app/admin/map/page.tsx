import type { Metadata } from "next";
import { AdminMap } from "@/components/admin/AdminMap";

export const metadata: Metadata = { title: "Admin · Map" };

export default function AdminMapPage() {
  return <AdminMap />;
}
