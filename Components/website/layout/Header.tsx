import { getSiteSettings } from "@/lib/settings";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const settings = await getSiteSettings();

  return <HeaderClient settings={settings} />;
}