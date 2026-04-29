import packageJson from "../../package.json";

export function Footer() {
  return (
    <footer className="border-t border-border py-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] text-center text-xs text-muted-foreground sm:pb-4">
      Вишлист&nbsp;·&nbsp;v{packageJson.version}
    </footer>
  );
}
