import type { Metadata } from "next";
import { AdminQueue } from "@/components/admin/AdminQueue";

export const metadata: Metadata = { title: "Admin · Review queue" };

export default function AdminPage() {
  return <AdminQueue />;
}
