import { routeTitle } from "@/lib/route-metadata";

export const generateMetadata = routeTitle("Подборки");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
