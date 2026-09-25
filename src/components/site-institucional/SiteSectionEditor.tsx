'use client';


import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { FileText } from 'lucide-react';

import {
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';

import type {
  SiteSectionConfig,
} from '@/types/site-institucional';

import {
  SiteImageUpload,
} from './SiteImageUpload';

type SiteSectionEditorProps = {
  slug: string,
  token: string,
  section: SiteSectionConfig;

  getValue: (path: string) => unknown;

  onChange: (
    path: string,
    value: string,

  ) => void;

  disabled?: boolean;
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: '#fff',
  },
};

export function SiteSectionEditor({
  slug,
  token,
  section,
  getValue,
  onChange,
  disabled = false,
}: SiteSectionEditorProps) {
  return (
    <CrmSection>
      <Box
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,

              display: 'grid',
              placeItems: 'center',

              borderRadius: '12px',

              bgcolor: '#fff7ed',
              color: crmPalette.orangeDark,

              flexShrink: 0,
            }}
          >
            <FileText size={20} />
          </Box>

          <Box>
            <Typography
              component="h2"
              sx={{
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              {section.title}
            </Typography>

            {section.description ? (
              <Typography
                sx={{
                  mt: 0.35,

                  color: 'text.secondary',

                  fontSize: 13,
                }}
              >
                {section.description}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',

          p: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <Stack spacing={2}>
          {section.fields.map((field) => {
            const value =
              getValue(
                field.path,
              );

            const stringValue =
              typeof value === 'string'
                ? value
                : '';

            if (
              field.type === 'image'
            ) {
              return (
                <SiteImageUpload
                  key={field.path}
                  slug={slug}
                  token={token}
                  label={field.label}
                  value={stringValue}
                  recommendedSize={
                    field.recommendedSize
                  }
                  disabled={disabled}
                  onChange={(
                    imageUrl,
                  ) =>
                    onChange(
                      field.path,
                      imageUrl,
                    )
                  }
                />
              );
            }

            return (
              <TextField
                key={field.path}
                label={field.label}
                value={stringValue}
                onChange={(event) =>
                  onChange(
                    field.path,
                    event.target.value,
                  )
                }
                placeholder={
                  field.placeholder
                }
                helperText={
                  field.helperText
                }
                multiline={
                  field.type ===
                  'textarea'
                }
                minRows={
                  field.type ===
                    'textarea'
                    ? field.rows ?? 4
                    : undefined
                }
                disabled={disabled}
                fullWidth
                sx={fieldSx}
              />
            );
          })}
        </Stack>
      </Box>
    </CrmSection>
  );
}
