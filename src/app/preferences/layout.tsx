import { routeTitle } from "@/lib/route-metadata";

export const generateMetadata = routeTitle("Подарочные профили");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
