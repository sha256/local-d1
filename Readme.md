# local-d1

**local-d1** replicates the interface of [Cloudflare D1](https://developers.cloudflare.com/d1/) for use during development, particularly in conjunction with `Next.js` in RSC and ServerActions.

## Motivation
The conventional alternative, [Wrangler](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/), has proven to be error-prone. It triggers a production build of the Next.js project upon even minor changes, making it impractical for development due to its slow performance. It often leads to random process exits, internal halts, and frequent 404 errors.

## Installation

```bash
npm install local-d1 @cloudflare/workers-types --save-dev
```

## Usage

1. Set up your D1 binding.
2. Create a utility function to return local-d1 database during development and the D1 binding in production.

```typescript
import { D1Database } from "@cloudflare/workers-types";

export function getDB(): D1Database {
  if (process.env.NODE_ENV === "development") {
    const { get, ensureInitialized } = require("local-d1");
    ensureInitialized("./db.sqlite", { verbose: console.log }); // TODO: change db path
    return get() as any;
  }
  return process.env.YOUR_D1_BINDING; // TODO: change your binding name
}
```

3. Use the utility function in RSC or ServerActions.

```typescript jsx
import { getDB } from "./db";

// export const runtime = 'edge';
// `runtime` value needs to be commented out during development

export default async function Page({ searchParams }: any) {
  const db = getDB();
  const users = await db.prepare("select * from users where role = ?").bind(1).all();

  return (
    <div>
      {/* Your component rendering logic goes here */}
    </div>
  );
}
```

`local-d1` uses [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) internally, and the parameters of `ensureInitialized` are directly forwarded to `better-sqlite3`.


## Caveats

- `export const runtime = 'edge';` must be commented out during development.