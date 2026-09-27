import { routeTitle } from "@/lib/route-metadata";

export const generateMetadata = routeTitle("Настройки");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
