import Box from '@mui/material/Box';

// Substitua public/images/dashboard/banner.png ou ajuste esta configuração.
export const dashboardBanner = {
  src: '/images/dashboard/banner.png',
  alt: 'Transporte, armazenagem e operação logística da Pizzattolog',
  objectPosition: 'center 58%',
};

type DashboardBannerProps = {
  src?: string;
  alt?: string;
  objectPosition?: string;
};

export function DashboardBanner({
  src = dashboardBanner.src,
  alt = dashboardBanner.alt,
  objectPosition = dashboardBanner.objectPosition,
}: DashboardBannerProps) {
  return (
    <Box sx={{ width: '100%', height: { xs: 180, sm: 240, md: 300 }, borderRadius: '16px', overflow: 'hidden', bgcolor: '#e5e7eb' }}>
      <Box component="img" src={src} alt={alt} fetchPriority="high"
        sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition }} />
    </Box>
  );
}
