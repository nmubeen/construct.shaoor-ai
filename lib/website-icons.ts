import {
  FaAward,
  FaBuilding,
  FaCircleCheck,
  FaClock,
  FaHandshake,
  FaHelmetSafety,
  FaMedal,
  FaShieldHalved,
  FaStar,
  FaThumbsUp,
  FaUsers,
  FaWrench,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

// A small curated registry, not a free-typed icon name: the "Why Choose
// Us" admin form offers a <select> of these keys, and the public
// section looks the actual icon component up from here. Keeps the
// stored value safe (always one of these) and the icon set on-brand for
// a construction company, rather than exposing every icon react-icons
// ships.
export const WEBSITE_ICONS: Record<string, { label: string; icon: IconType }> = {
  building: { label: "Building", icon: FaBuilding },
  helmet: { label: "Safety helmet", icon: FaHelmetSafety },
  clock: { label: "Clock", icon: FaClock },
  award: { label: "Award", icon: FaAward },
  shield: { label: "Shield", icon: FaShieldHalved },
  medal: { label: "Medal", icon: FaMedal },
  users: { label: "Team / people", icon: FaUsers },
  wrench: { label: "Wrench / tools", icon: FaWrench },
  check: { label: "Checkmark", icon: FaCircleCheck },
  star: { label: "Star", icon: FaStar },
  handshake: { label: "Handshake", icon: FaHandshake },
  thumbsUp: { label: "Thumbs up", icon: FaThumbsUp },
};

export const WEBSITE_ICON_KEYS = Object.keys(WEBSITE_ICONS);
export const DEFAULT_WEBSITE_ICON_KEY = "building";

export function isValidWebsiteIconKey(key: string): boolean {
  return key in WEBSITE_ICONS;
}
