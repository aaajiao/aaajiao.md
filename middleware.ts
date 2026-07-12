import { next, rewrite } from '@vercel/edge'
import { prefersMarkdown } from './shared/negotiate'

export const config = {
  matcher: '/',
}

export default function middleware(request: Request) {
  const accept = request.headers.get('accept') || ''

  if (!prefersMarkdown(accept)) {
    return next()
  }

  return rewrite(new URL('/llms-full.txt', request.url))
}
