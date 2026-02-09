export function ApiHint() {
  return (
    <div className="mt-8 mb-8 rounded border border-zinc-700 bg-zinc-900 px-6 py-4 font-mono text-sm text-zinc-400">
      <p>For AI: <code className="text-zinc-200">curl {window.location.origin}/api</code></p>
    </div>
  )
}
