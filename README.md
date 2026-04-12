# routewatch

A lightweight CLI tool that monitors and visualizes Express/Fastify route usage and latency in real time.

---

## Installation

```bash
npm install -g routewatch
```

Or as a dev dependency:

```bash
npm install --save-dev routewatch
```

---

## Usage

Add the middleware to your Express or Fastify app:

```typescript
import { routewatch } from "routewatch";

// Express
app.use(routewatch());

// Fastify
fastify.register(routewatch());
```

Then start the CLI dashboard in a separate terminal:

```bash
npx routewatch --port 3000
```

You'll see a live terminal dashboard displaying:
- Hit counts per route
- Average and p95 latency
- Status code distribution
- Requests per second

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `3000` | Port your app is running on |
| `--interval` | `1000` | Refresh interval in ms |
| `--filter` | `*` | Filter routes by pattern |

---

## Requirements

- Node.js >= 16
- Express >= 4 or Fastify >= 3
- TypeScript >= 4.5

---

## License

[MIT](./LICENSE)