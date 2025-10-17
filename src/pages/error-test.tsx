import dynamic from 'next/dynamic';

// Dynamically import the content component with no SSR
const ErrorTestContent = dynamic(
  () => import('@/components/ErrorTest').then(mod => ({ default: mod.ErrorTestContent })),
  { 
    ssr: false
  }
);

export default function ErrorTestPage() {
  return <ErrorTestContent />;
}