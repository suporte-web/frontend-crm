import { useParams } from 'react-router-dom';
import { SitePageEditor } from '@/components/site-institucional/SitePageEditor';
export default function PaginaSiteInstitucional() {
  const { slug = '' } = useParams<'slug'>();
  return <SitePageEditor slug={slug} />;
}
