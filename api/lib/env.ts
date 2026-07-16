/** Safe env read for Vercel Edge without relying on Node typings */
export function readEnv(name: string): string {
  const g = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }
  return g.process?.env?.[name] ?? ''
}
