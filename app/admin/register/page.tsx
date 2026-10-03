import { redirect } from "next/navigation";

export default async function AdminRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const url = new URL("/register", "http://n");
  if (error) url.searchParams.set("error", error);
  redirect(url.pathname + (url.search ? url.search : ""));
}

