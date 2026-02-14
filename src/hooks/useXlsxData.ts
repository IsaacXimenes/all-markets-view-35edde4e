import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface UseXlsxDataOptions {
  url: string;
  headerMap?: Record<string, string>;
}

export function useXlsxData<T = Record<string, string>>({ url, headerMap }: UseXlsxDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndParse = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (jsonData.length > 0) {
          const rawHeaders = Object.keys(jsonData[0]);
          const mappedHeaders = headerMap
            ? rawHeaders.map(h => headerMap[h] || h)
            : rawHeaders;
          setHeaders(mappedHeaders);

          if (headerMap) {
            const mappedData = jsonData.map(row => {
              const newRow: Record<string, any> = {};
              rawHeaders.forEach(key => {
                const newKey = headerMap[key] || key;
                newRow[newKey] = row[key] ?? '';
              });
              return newRow as T;
            });
            setData(mappedData);
          } else {
            setData(jsonData as T[]);
          }
        }

        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados do arquivo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndParse();
  }, [url]);

  return { data, headers, loading, error };
}
