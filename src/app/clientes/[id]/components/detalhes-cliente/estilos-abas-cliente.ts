import type { SxProps, Theme } from "@mui/material/styles";
import { crmPalette as paletaOriginal } from "@/components/mui/crm-primitives";

export const paletaAbasCliente = { ...paletaOriginal, orange: "#ff5805", orangeDark: "#e94f00" };
export const superficieAbasClienteSx = {
  p: { xs: 2, md: 2.5 }, borderRadius: "14px", border: "1px solid #e2e8f0", bgcolor: "#fff", boxShadow: "none",
  "& .MuiPaper-root": { bgcolor: "#fff", borderColor: "#e2e8f0", borderRadius: "14px", boxShadow: "none" },
  "& .MuiButton-root": { minHeight: 40, borderRadius: "8px", fontWeight: 700, textTransform: "none", boxShadow: "none" },
  "& .MuiButton-contained": { bgcolor: "#ff5805", color: "#fff", "&:hover": { bgcolor: "#e94f00", boxShadow: "none" }, "&.Mui-disabled": { bgcolor: "#e2e8f0", color: "#94a3b8" } },
  "& .MuiButton-outlined": { borderColor: "#cbd5e1", bgcolor: "#fff", color: "#475569", "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" } },
  "& .MuiListItem-root .MuiPaper-root .MuiBox-root": { bgcolor: "#fff", borderColor: "#e2e8f0" },
  "& .MuiListItem-root .MuiBox-root > svg": { color: "#64748b" },
  "& .MuiListItem-root .MuiPaper-root .MuiTypography-root": { color: "#475569" },
  "& .MuiListItem-root .MuiInputBase-input": { fontSize: 14, fontWeight: 400 },
  "& .MuiListItem-root .MuiInputLabel-root": { fontSize: 14, fontWeight: 400 },
  "& .MuiListItem-root .MuiOutlinedInput-root.Mui-focused": { boxShadow: "none", "& fieldset": { borderColor: "#ff5805" } },
  "& .MuiListItem-root .MuiAvatar-root": { bgcolor: "#f8fafc", color: "#475569" },
  "& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)": { minHeight: 40, height: 40 },
} satisfies SxProps<Theme>;
export const campoPequenoClienteSx = {
  width: "100%", minWidth: 0, alignSelf: "start",
  "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#fff", fontWeight: 400, "&.Mui-focused": { boxShadow: "none" }, "&.Mui-focused fieldset": { borderColor: "#ff5805" } },
  "& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)": { minHeight: 40, height: 40 },
  "& .MuiInputBase-input": { fontSize: 14, fontWeight: 400 },
  "& .MuiInputLabel-root": { fontSize: 14, fontWeight: 400 },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ff5805" },
  "& .MuiSelect-select": { fontWeight: 400 },
} satisfies SxProps<Theme>;
