export const formatData = (data) => {
  const trialBalance = {
    id: data.Header?.ReportName ?? 'N/A',
    name: data.Header?.ReportName ?? 'Trial Balance',
    date: data.Header?.Time ?? 'N/A',
    start_date: data.Header?.StartPeriod ?? 'N/A',
    rows: data.Rows?.Row?.map((row) => {
      const colData = row.ColData || row.Summary?.ColData;
      return {
        id: colData[0]?.id ?? 'N/A',
        name: colData[0]?.value,
        debit: colData.length > 1 && colData[1]?.value !== "" ? colData[1].value : '',
        credit: colData.length > 2 && colData[2]?.value !== "" ? colData[2].value : '',
        value: colData.length > 1 ? colData[1]?.value || colData[2]?.value : '',
      }
    }) ?? [],
  };
  
  return trialBalance;
}
