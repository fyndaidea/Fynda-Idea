import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reason?: string }>;
}) {
  const { next, error, reason } = await searchParams;

  const url = new URL("/login", "http://n");
  if (next) url.searchParams.set("next", next);
  if (error) url.searchParams.set("error", error);
  if (reason) url.searchParams.set("reason", reason);
  redirect(url.pathname + (url.search ? url.search : ""));
}

