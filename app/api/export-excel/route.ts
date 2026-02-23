// app/api/export-excel/route.ts - CSV export: semicolon delimiter (Excel IL), one section per product
// Updated: Web and Shopping sources are now separated into distinct column groups

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

    // ========== Summary: Date + one column per model per source (for comparison) ==========
    if (results.series && results.series.length > 0) {
      sections.push(rowToCsv(['========== Summary: all models side by side ==========']));
      sections.push(emptyRows(1));

      type Col = { seriesIdx: number; model: string; sourceLabel: string; getValue: (ts: number) => number | '' };
      const columns: Col[] = [];
      
      // Helper to get short source name
      const getShortSourceName = (label: string, source: string): string => {
        const labelLower = label.toLowerCase();
        if (labelLower.includes('web') && !labelLower.includes('youtube')) return 'Web';
        if (labelLower.includes('youtube')) return 'YouTube';
        if (labelLower.includes('shopping')) return 'Shopping';
        if (labelLower.includes('images')) return 'Images';
        if (labelLower.includes('news')) return 'News';
        if (labelLower.includes('froogle')) return 'Froogle';
        // Fallback to source if label doesn't match
        if (source.includes('web')) return 'Web';
        if (source.includes('youtube')) return 'YouTube';
        if (source.includes('shopping')) return 'Shopping';
        return 'Trends';
      };
      
      results.series.forEach((series, seriesIdx) => {
        const sourceLabel = getShortSourceName(series.label || '', series.source || '');
        const qdm = series.extra?.queryDataMap;
        if (qdm && Object.keys(qdm).length > 0) {
          const models = series.extra?.queries || Object.keys(qdm);
          models.forEach((model) => {
            const points = qdm[model];
            if (points && points.length > 0) {
              columns.push({
                seriesIdx,
                model: `${model.trim()} (${sourceLabel})`,
                sourceLabel,
                getValue: (ts) => {
                  const pt = points.find((p) => p.timestamp === ts);
                  return pt != null ? pt.value : '';
                },
              });
            }
          });
        } else {
          // No per-query data: use series label/query as model name
          const modelName = (series.label || series.query).trim();
          columns.push({
            seriesIdx,
            model: `${modelName} (${sourceLabel})`,
            sourceLabel,
            getValue: (ts) => {
              const pt = series.points.find((p) => p.timestamp === ts);
              return pt != null ? pt.value : '';
            },
          });
        }
      });

      // Sort columns: group by model name, then separate Web sources from Shopping sources
      const sourceOrder: Record<string, number> = { 
        'Web': 1, 
        'YouTube': 2, 
        'Images': 3, 
        'News': 4, 
        'Shopping': 5,  // Shopping comes after all other sources
        'Froogle': 6, 
        'Trends': 7 
      };
      
      columns.sort((a, b) => {
        // Extract model name (before parentheses)
        const modelA = a.model.split(' (')[0].toLowerCase();
        const modelB = b.model.split(' (')[0].toLowerCase();
        
        if (modelA !== modelB) {
          return modelA.localeCompare(modelB);
        }
        
        // Same model: separate Web sources from Shopping
        const isShoppingA = a.sourceLabel === 'Shopping' || a.sourceLabel === 'Froogle';
        const isShoppingB = b.sourceLabel === 'Shopping' || b.sourceLabel === 'Froogle';
        
        // Web sources first, then Shopping
        if (isShoppingA !== isShoppingB) {
          return isShoppingA ? 1 : -1;
        }
        
        // Both same type (Web or Shopping): sort by source order
        const sourceOrderA = sourceOrder[a.sourceLabel] || 99;
        const sourceOrderB = sourceOrder[b.sourceLabel] || 99;
        return sourceOrderA - sourceOrderB;
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
        ['Price (start)', m.priceFirst != null ? m.priceFirst.toFixed(4) : ''],
        ['Price (end)', m.priceLast != null ? m.priceLast.toFixed(4) : ''],
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
        ['Date (window mid)', 'Price', 'Total Return (%)', 'Volatility (StdDev)'],
        ...results.alphaSlidingWindow.windows.map((w) => {
          const m = w.metrics[symbol] || {};
          return [
            w.midpoint,
            m.price != null ? m.price.toFixed(4) : '',
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
