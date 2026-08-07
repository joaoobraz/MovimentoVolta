import type { ComponentPropsWithoutRef } from "react";

type SafeLinkProps = ComponentPropsWithoutRef<"a"> & { href: string };

export function SafeLink({ href, children, ...props }: SafeLinkProps) {
  return <a href={href} {...props}>{children}</a>;
}
