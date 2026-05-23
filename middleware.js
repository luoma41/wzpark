export function middleware(context) {
  const { request, next, rewrite } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // API routes: pass through to cloud functions
  if (pathname.startsWith('/api/')) {
    return next();
  }

  // Static files with extensions: pass through
  if (/\.\w+$/.test(pathname)) {
    return next();
  }

  // SPA fallback: rewrite all other paths to index.html
  return rewrite('/index.html');
}

export const config = {
  matcher: ['/:path*'],
};
