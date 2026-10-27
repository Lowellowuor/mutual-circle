function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  const header = Object.keys(rows[0] ?? {});
  const csv = [
    header.join(','),
    ...rows.map(r => header.map(k => JSON.stringify(r[k] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
