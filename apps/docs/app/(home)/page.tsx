import Link from "next/link"

const packages = [
  {
    name: "@varve/statcan-wds",
    badge: "Statistics Canada",
    title: "Web Data Service",
    description:
      "Time series vectors, table metadata, and release monitoring. Full coverage of all 16 WDS endpoints with automated 409/500 retry handling.",
    href: "/docs/statcan-wds",
  },
  {
    name: "@varve/statcan-rdaas",
    badge: "Statistics Canada",
    title: "Reference Data as a Service",
    description:
      "Industry and occupation classifications (NAICS/NOC), hierarchical code trees, plain-English index search, and version concordances.",
    href: "/docs/statcan-rdaas",
  },
  {
    name: "@varve/ons-api",
    badge: "UK Office for National Statistics",
    title: "ONS API",
    description:
      "Economic and demographic timeseries by CDID, dataset topic navigation, observation querying, and filtered CSV/XLS data extracts.",
    href: "/docs/ons-api",
  },
]

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl w-full">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-md border border-fd-border bg-fd-muted px-3 py-1 text-xs font-medium text-fd-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            MIT Licensed
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-fd-foreground">
            Varve Agency SDKs
          </h1>
          <p className="text-lg text-fd-muted-foreground max-w-2xl leading-relaxed">
            Technical documentation for isomorphic, Zod-validated TypeScript
            clients interacting with Statistics Canada and the UK Office for
            National Statistics APIs.
          </p>
          <div className="flex gap-4 pt-4 text-sm">
            <Link
              href="/docs"
              className="font-medium text-fd-primary hover:underline"
            >
              Getting Started →
            </Link>
            <a
              href="https://github.com/varve-ca/agency-sdks"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>

        {/* Installation */}
        <div className="mb-12">
          <h2 className="text-lg font-medium mb-4 text-fd-foreground">
            Installation
          </h2>
          <div className="rounded-xl border border-fd-border bg-fd-card p-4 overflow-x-auto">
            <code className="text-sm font-mono text-fd-card-foreground">
              npm install @varve/statcan-wds @varve/statcan-rdaas @varve/ons-api
              zod
            </code>
          </div>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            Note: <code className="font-mono text-xs">zod</code> is a required
            peer dependency for runtime validation.
          </p>
        </div>

        {/* Packages */}
        <div className="mb-16">
          <h2 className="text-lg font-medium mb-4 text-fd-foreground">
            Available Packages
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Link
                key={pkg.href}
                href={pkg.href}
                className="group flex flex-col justify-between rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-ring"
              >
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-fd-muted-foreground">
                    {pkg.badge}
                  </p>
                  <div className="mb-2 font-mono text-xs font-semibold text-fd-foreground">
                    {pkg.name}
                  </div>
                  <p className="text-sm text-fd-muted-foreground leading-relaxed">
                    {pkg.description}
                  </p>
                </div>
                <div className="mt-4 text-xs font-medium text-fd-primary group-hover:underline">
                  View documentation →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Architecture */}
        <div>
          <h2 className="text-lg font-medium mb-4 text-fd-foreground">
            Architecture &amp; Design
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-fd-border bg-fd-card p-5">
              <h3 className="font-medium text-fd-foreground mb-2">
                Runtime Validation
              </h3>
              <p className="text-sm text-fd-muted-foreground leading-relaxed">
                All external API responses are parsed through Zod schemas.
                Upstream contract violations or structural anomalies throw
                structured errors immediately rather than corrupting application
                state.
              </p>
            </div>
            <div className="rounded-xl border border-fd-border bg-fd-card p-5">
              <h3 className="font-medium text-fd-foreground mb-2">
                Isomorphic Implementation
              </h3>
              <p className="text-sm text-fd-muted-foreground leading-relaxed">
                Clients rely exclusively on the standard Fetch API without
                Node.js-specific dependencies. Supported across Node.js 18+,
                modern browsers, and edge runtimes (e.g., Cloudflare Workers).
              </p>
            </div>
            <div className="rounded-xl border border-fd-border bg-fd-card p-5">
              <h3 className="font-medium text-fd-foreground mb-2">
                Network Resilience
              </h3>
              <p className="text-sm text-fd-muted-foreground leading-relaxed">
                Built-in retry mechanisms with exponential backoff.
                Automatically handles transient 409/429/500 HTTP statuses,
                transparently respecting{" "}
                <code className="font-mono text-[10px]">Retry-After</code>{" "}
                headers.
              </p>
            </div>
            <div className="rounded-xl border border-fd-border bg-fd-card p-5">
              <h3 className="font-medium text-fd-foreground mb-2">
                Build Optimization
              </h3>
              <p className="text-sm text-fd-muted-foreground leading-relaxed">
                Distributed as dual ESM/CJS bundles. Explicitly marked as
                side-effect free (
                <code className="font-mono text-[10px]">
                  sideEffects: false
                </code>
                ) to ensure comprehensive tree-shaking in modern bundlers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
