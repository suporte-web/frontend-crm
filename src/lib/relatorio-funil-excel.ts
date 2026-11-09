import { Workbook } from 'exceljs';

export type LinhaRelatorioFunil = {
  empresa: string;
  segmento: string;
  transporte: string;
  armazenagem: string;
  etapa: string;
  entrada: string;
  ultimaInteracao: string;
  volumeMensal: number;
  responsavel: string;
  situacao: string;
  proximaAcao: string;
  observacoes: string;
};

export async function gerarRelatorioFunilExcel(linhas: LinhaRelatorioFunil[]) {
  const workbook = new Workbook();
  workbook.creator = 'CRM Pizzattolog';
  const sheet = workbook.addWorksheet('Leads e clientes', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    { header: 'Empresa', key: 'empresa', width: 42 },
    { header: 'Segmento', key: 'segmento', width: 24 },
    { header: 'Transporte', key: 'transporte', width: 24 },
    { header: 'Armazenagem', key: 'armazenagem', width: 24 },
    { header: 'Etapa do funil', key: 'etapa', width: 24 },
    { header: 'Data de entrada', key: 'entrada', width: 18 },
    { header: 'Última interação', key: 'ultimaInteracao', width: 18 },
    { header: 'Volume mensal estimado (R$)', key: 'volumeMensal', width: 29, style: { numFmt: '"R$" #,##0.00' } },
    { header: 'Responsável', key: 'responsavel', width: 28 },
    { header: 'Situação', key: 'situacao', width: 30 },
    { header: 'Próxima ação', key: 'proximaAcao', width: 45 },
    { header: 'Observações', key: 'observacoes', width: 60 },
  ];
  sheet.addRows(linhas);
  sheet.autoFilter = 'A1:L1';
  sheet.eachRow((row, index) => {
    row.alignment = { vertical: 'top', wrapText: true };
    if (index === 1) {
      row.height = 32;
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF5805' } };
    }
  });
  return workbook.xlsx.writeBuffer();
}
