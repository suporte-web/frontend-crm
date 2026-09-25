import { SitePageEditor } from '@/components/site-institucional/SitePageEditor';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { slug } = await params;

  return (
    <SitePageEditor
      slug={slug}
    />
  );
}