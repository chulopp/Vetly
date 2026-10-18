import ResultPage, { generateMetadata as baseGenerateMetadata } from '@/app/result/[id]/page';

export const dynamic = 'force-dynamic';

export { baseGenerateMetadata as generateMetadata };

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  return <ResultPage params={params} forceShared={true} searchParams={Promise.resolve({ shared: 'true' })} />;
}
