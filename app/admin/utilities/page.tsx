import { UtilitiesAdminClient } from "@/components/admin/UtilitiesAdminClient";

export const dynamic = "force-dynamic";

export default function AdminUtilitiesPage() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto py-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <UtilitiesAdminClient />
      </div>
    </main>
  );
}
