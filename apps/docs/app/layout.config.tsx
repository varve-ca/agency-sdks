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
      url: "/agency-sdks/docs",
      active: "nested-url",
    },
    {
      text: "Status",
      url: "/agency-sdks/status",
    },
    {
      text: "GitHub",
      url: "https://github.com/varve-ca/agency-sdks",
      external: true,
    },
    {
      text: "npm",
      url: "https://www.npmjs.com/search?q=%40varve",
      external: true,
    },
  ],
}
