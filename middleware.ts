import { next, rewrite } from '@vercel/edge'

export const config = {
  matcher: '/',
}

export default function middleware(request: Request) {
  const accept = (request.headers.get('accept') || '').toLowerCase()

  if (!accept.includes('text/markdown')) {
    return next()
  }

  // If markdown is asked alongside html, only re-route when markdown is explicit
  // and html is absent (or lower quality). Cheap heuristic: html absent => markdown wins.
  if (accept.includes('text/html')) {
    return next()
  }

  return rewrite(new URL('/llms-full.txt', request.url))
}
