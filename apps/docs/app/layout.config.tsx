import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="font-mono text-sm font-semibold tracking-tight">
        @varve/agency-sdks
      </span>
    ),
  },
  links: [
    {
      text: "Documentation",
      url: "/docs",
      active: "nested-url",
    },
    {
      text: "Status",
      url: "/status",
    },
    {
      text: "GitHub",
      url: "https://github.com/varve-ca/agency-sdks",
      external: true,
    },
    {
      text: "npm",
      url: "https://www.npmjs.com/org/varve",
      external: true,
    },
  ],
}
