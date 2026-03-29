import packageJson from "../../package.json";

export function Footer() {
  return (
    <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
      Вишлист&nbsp;·&nbsp;v{packageJson.version}
    </footer>
  );
}
