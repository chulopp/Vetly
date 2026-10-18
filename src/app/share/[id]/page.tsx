import ResultPage, { generateMetadata as baseGenerateMetadata } from '@/app/result/[id]/page';

export { baseGenerateMetadata as generateMetadata };

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  return <ResultPage params={params} searchParams={Promise.resolve({ shared: 'true' })} />;
}
