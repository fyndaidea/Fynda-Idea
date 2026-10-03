import { getSiteNavVisibility } from "@/lib/site-nav-visibility";
import SiteChromeClient from "./SiteChromeClient";

export default async function SiteChrome({ children }: { children: React.ReactNode }) {
  const navVisibility = await getSiteNavVisibility();
  return <SiteChromeClient navVisibility={navVisibility}>{children}</SiteChromeClient>;
}
