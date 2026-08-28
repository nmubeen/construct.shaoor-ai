import { getPublicSiteSettings } from "@/lib/public-site-data";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const settings = await getPublicSiteSettings();

  return <HeaderClient settings={settings} />;
}
