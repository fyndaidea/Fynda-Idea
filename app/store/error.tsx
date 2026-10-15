'use client';
export default function StoreErrorPage({ reset }: { reset: ()=>void }) {
  return <main className="store-main"><div className="store-empty"><h1>The store is temporarily unavailable.</h1><p>Please try again in a moment.</p><button className="store-button" onClick={reset}>Try again</button></div></main>;
}
