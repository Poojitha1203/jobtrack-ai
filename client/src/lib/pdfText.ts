// Extracts plain text from a PDF entirely in the browser using Mozilla's pdf.js.
// pdf.js is large, so it's loaded on demand (only when someone uploads a resume).

export async function extractPdfText(file: File): Promise<string> {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdf = await task.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let line = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
      } else if (item.str && !item.str.endsWith(' ')) {
        line += ' ';
      }
    }
    if (line.trim()) lines.push(line);
    pages.push(lines.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n'));
  }
  await task.destroy();
  return pages.join('\n\n').trim();
}

export const countWords = (text: string | null) => (text ? text.split(/\s+/).filter(Boolean).length : 0);
