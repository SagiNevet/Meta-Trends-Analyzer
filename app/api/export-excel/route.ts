// app/api/export-excel/route.ts - CSV export: semicolon delimiter (Excel IL), one section per product

import { NextRequest, NextResponse } from 'next/server';
import type { AnalyzeResponse } from '@/lib/types';

const UTF8_BOM = '\uFEFF';
const SEP = ';'; // Excel Israel/Europe expects semicolon as list separator

function escapeCell(value: unknown): string {
  const s = String(value ?? '');
  const mustQuote = /[;"\r\n]/.test(s) || s.includes(SEP);
  if (mustQuote) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function rowToCsv(row: unknown[]): string {
  return row.map(escapeCell).join(SEP);
}

function rowsToCsv(rows: unknown[][]): string {
  return rows.map((r) => rowToCsv(r)).join('\r\n');
}

function emptyRows(n: number): string {
  return n <= 0 ? '' : Array(n).fill('').join('\r\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results, alphaPrimarySymbol } = body as {
      results: AnalyzeResponse;
      alphaPrimarySymbol: string;
    };

    if (!results) {
      return NextResponse.json({ error: 'Missing results' }, { status: 400 });
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '-');
    const dateTimeStr = `${dateStr}_${timeStr}`;
    const sections: string[] = [];

    // ---- Title ----
    sections.push(rowToCsv(['Meta Trends Analysis', dateStr]));
    sections.push(emptyRows(2));

    // ========== Google Trends: one section per MODEL/PRODUCT (each query gets its own block) ==========
    if (results.series && results.series.length > 0) {
      sections.push(rowToCsv(['========== Google Trends ==========']));
      sections.push(emptyRows(1));

      let productNumber = 0;
      for (const series of results.series) {
        const sourceLabel = (series.label || series.source || series.query).trim();
        const queryDataMap = series.extra?.queryDataMap;
        const hasPerModel = queryDataMap && Object.keys(queryDataMap).length > 0;

        if (hasPerModel) {
          // One clear section per model/product (iphone 12, iphone 13, etc.)
          const models = series.extra?.queries || Object.keys(queryDataMap!);
          for (const modelName of models) {
            const points = queryDataMap![modelName];
            if (!points || points.length === 0) continue;
            productNumber++;
            sections.push(rowToCsv(['--- מודל ' + productNumber + ' / Model: ' + modelName.trim() + ' (' + sourceLabel + ') ---']));
            sections.push(rowToCsv(['Source', series.source]));
            sections.push(rowToCsv(['Query', modelName.trim()]));
            if (series.extra?.description) {
              sections.push(rowToCsv(['Description', series.extra.description]));
            }
            sections.push(emptyRows(1));
            sections.push(rowToCsv(['Date', 'Value']));
            const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
            for (const p of sorted) {
              sections.push(rowToCsv([new Date(p.timestamp * 1000).toISOString().split('T')[0], p.value]));
            }
            sections.push(emptyRows(2));
          }
        } else {
          // No per-query data: one section for the whole series (combined)
          productNumber++;
          sections.push(rowToCsv(['--- מודל ' + productNumber + ' / Product: ' + sourceLabel + ' ---']));
          sections.push(rowToCsv(['Source', series.source]));
          sections.push(rowToCsv(['Query', series.query]));
          if (series.extra?.description) {
            sections.push(rowToCsv(['Description', series.extra.description]));
          }
          sections.push(emptyRows(1));
          sections.push(rowToCsv(['Date', 'Value']));
          const points = [...series.points].sort((a, b) => a.timestamp - b.timestamp);
          for (const p of points) {
            sections.push(rowToCsv([new Date(p.timestamp * 1000).toISOString().split('T')[0], p.value]));
          }
          sections.push(emptyRows(2));
        }
      }
    }

    // ========== Summary: Date + one column per model (for comparison) ==========
    if (results.series && results.series.length > 0) {
      sections.push(rowToCsv(['========== Summary: all models side by side ==========']));
      sections.push(emptyRows(1));

      type Col = { seriesIdx: number; model: string; getValue: (ts: number) => number | '' };
      const columns: Col[] = [];
      results.series.forEach((series, seriesIdx) => {
        const qdm = series.extra?.queryDataMap;
        if (qdm && Object.keys(qdm).length > 0) {
          const models = series.extra?.queries || Object.keys(qdm);
          models.forEach((model) => {
            const points = qdm[model];
            if (points && points.length > 0) {
              columns.push({
                seriesIdx,
                model: model.trim(),
                getValue: (ts) => {
                  const pt = points.find((p) => p.timestamp === ts);
                  return pt != null ? pt.value : '';
                },
              });
            }
          });
        } else {
          columns.push({
            seriesIdx,
            model: (series.label || series.query).trim(),
            getValue: (ts) => {
              const pt = series.points.find((p) => p.timestamp === ts);
              return pt != null ? pt.value : '';
            },
          });
        }
      });

      const allTs = new Set<number>();
      results.series.forEach((s) => {
        const qdm = s.extra?.queryDataMap;
        if (qdm) {
          Object.values(qdm).forEach((pts) => pts.forEach((p) => allTs.add(p.timestamp)));
        } else {
          s.points.forEach((p) => allTs.add(p.timestamp));
        }
      });
      const sortedTs = Array.from(allTs).sort((a, b) => a - b);

      const headerRow: unknown[] = ['Date', ...columns.map((c) => c.model)];
      sections.push(rowToCsv(headerRow));
      for (const ts of sortedTs) {
        const dateCell = new Date(ts * 1000).toISOString().split('T')[0];
        const row: unknown[] = [dateCell, ...columns.map((c) => c.getValue(ts))];
        sections.push(rowToCsv(row));
      }
      sections.push(emptyRows(2));
    }

    // ========== Stock - Fixed Window ==========
    if (results.alphaFixedWindow) {
      sections.push(rowToCsv(['========== Stock - Fixed Window ==========']));
      sections.push(emptyRows(1));

      const symbol = results.alphaFixedWindow.symbols[0];
      const m = results.alphaFixedWindow.metrics[symbol] || {};
      const stockRows: unknown[][] = [
        ['Metric', 'Value'],
        ['Symbol', symbol],
        ['Period', results.alphaFixedWindow.range.start + ' - ' + results.alphaFixedWindow.range.end],
        ['Interval', results.alphaFixedWindow.interval],
        ['Total Return (%)', m.cumulativeReturn?.toFixed(2) ?? ''],
        ['Max Drawdown (%)', m.maxDrawdown?.toFixed(2) ?? ''],
        ['Volatility (StdDev)', m.stddev?.toFixed(4) ?? ''],
        ['Mean Return', m.mean?.toFixed(4) ?? ''],
        ['Variance', m.variance?.toFixed(4) ?? ''],
      ];
      sections.push(rowsToCsv(stockRows));
      sections.push(emptyRows(2));
    }

    // ========== Stock - Sliding Window ==========
    if (results.alphaSlidingWindow && results.alphaSlidingWindow.windows.length > 0) {
      sections.push(rowToCsv(['========== Stock - Sliding Window ==========']));
      sections.push(emptyRows(1));

      const symbol = results.alphaSlidingWindow.symbols[0];
      const slidingRows: unknown[][] = [
        ['Date (window mid)', 'Total Return (%)', 'Volatility (StdDev)'],
        ...results.alphaSlidingWindow.windows.map((w) => {
          const m = w.metrics[symbol] || {};
          return [
            w.midpoint,
            m.cumulativeReturn?.toFixed(2) ?? '',
            m.stddev?.toFixed(4) ?? '',
          ];
        }),
      ];
      sections.push(rowsToCsv(slidingRows));
      sections.push(emptyRows(1));
    }

    // sep=; tells Excel to use semicolon as column delimiter (so columns split correctly)
    const csv = UTF8_BOM + 'sep=' + SEP + '\r\n' + sections.join('\r\n');
    const fileName = `trend-analysis-${alphaPrimarySymbol || 'export'}-${dateTimeStr}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate export' },
      { status: 500 }
    );
  }
}
