import { NextRequest, NextResponse } from 'next/server';
import type { AnalyzeResponse } from '@/lib/types';

function generateCSVForAI(data: AnalyzeResponse): string {
  const rows: string[] = [];
  
  rows.push('# Meta Trends Analyzer - AI Analysis Data');
  rows.push('# This CSV contains trend data with explanations for AI analysis');
  rows.push('');
  
  rows.push('# Google Trends Data:');
  rows.push('# - Source: The data source (google_web, google_youtube, etc.)');
  rows.push('# - Query: Search query term');
  rows.push('# - Date: Date of measurement');
  rows.push('# - Value: Interest index (0-100 scale)');
  rows.push('# - Label: Human-readable label for the source');
  rows.push('# - Region: Geographic region');
  rows.push('# - Category: Search category');
  rows.push('');
  rows.push('Source,Query,Date,Value,Label,Region,Category');
  
  if (data.series && data.series.length > 0) {
    data.series.forEach(series => {
      series.points.forEach(point => {
        const date = new Date(point.timestamp * 1000).toISOString().split('T')[0];
        const row = [
          series.source,
          '"' + series.query + '"',
          date,
          point.value.toFixed(2),
          '"' + series.label + '"',
          series.region || 'WORLDWIDE',
          series.extra?.category || 'N/A'
        ].join(',');
        rows.push(row);
      });
    });
    rows.push('');
  }
  
  if (data.alphaFixedWindow) {
    rows.push('# Alpha Vantage Stock Data:');
    rows.push('# - Symbol: Stock ticker symbol');
    rows.push('# - Metric: Type of metric (cumulativeReturn, maxDrawdown, stddev)');
    rows.push('# - Value: Metric value');
    rows.push('# - Date Range: Time period analyzed');
    rows.push('# - Cumulative Return: Total return % over the selected period');
    rows.push('# - Max Drawdown: Maximum decline from peak (%)');
    rows.push('# - StdDev: Volatility measure');
    rows.push('');
    rows.push('Symbol,Metric,Value,DateRangeStart,DateRangeEnd,Interval,OHLC');
    
    const fixed = data.alphaFixedWindow;
    fixed.symbols.forEach(symbol => {
      const metrics = fixed.metrics[symbol] || {};
      Object.entries(metrics).forEach(([metricName, value]) => {
        const row = [
          symbol,
          metricName,
          typeof value === 'number' ? value.toFixed(4) : String(value),
          fixed.range.start,
          fixed.range.end,
          fixed.interval,
          fixed.ohlc
        ].join(',');
        rows.push(row);
      });
    });
    rows.push('');
  }
  
  return rows.join('\n');
}

function generateAIPrompt(csvData: string): string {
  const promptText = 'You are a data analyst expert. Analyze the following trend data and provide insights in simple, clear language.\n\n';
  const csvSection = 'CSV Data:\n' + csvData + '\n\n';
  const instructions = 'Please analyze this data and provide:\n1. Overall trend summary - What patterns do you see?\n2. Key insights - What are the most important findings?\n3. Recommendations - What should be done based on this data?\n4. Risk factors - Are there any concerning trends?\n\n';
  const languageNote = 'Write in clear, simple language that a business person can understand. Use Hebrew for the response.\n\n';
  const format = 'Format your response as:\n## Summary\n[Your summary here]\n\n## Key Insights\n[Your insights here]\n\n## Recommendations\n[Your recommendations here]\n\n## Risk Factors\n[Any risks or concerns here]\n';
  
  return promptText + csvSection + instructions + languageNote + format;
}

export async function POST(request: NextRequest) {
  try {
    const body: { data: AnalyzeResponse } = await request.json();
    
    if (!body.data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      );
    }
    
    const csvData = generateCSVForAI(body.data);
    const prompt = generateAIPrompt(csvData);
    
    const aiApiKey = process.env.HUGGINGFACE_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!aiApiKey) {
      const noKeyMessage = 'To get AI analysis, please configure an AI API key (HUGGINGFACE_API_KEY or OPENAI_API_KEY) in your environment variables.\n\nFor free options:\n1. Hugging Face Inference API: https://huggingface.co/inference-api (free tier available)\n2. Google Gemini API: https://ai.google.dev/ (free tier available)\n\nPrompt to use:\n' + prompt;
      return NextResponse.json({
        csvData,
        prompt,
        analysis: noKeyMessage,
        needsApiKey: true
      });
    }
    
    try {
      const hfModel = 'mistralai/Mistral-7B-Instruct-v0.2';
      const apiUrl = 'https://api-inference.huggingface.co/models/' + hfModel;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + aiApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const analysisText = result[0]?.generated_text || result.generated_text || 'Analysis complete';
        return NextResponse.json({
          csvData,
          prompt,
          analysis: analysisText,
          needsApiKey: false
        });
      }
    } catch (hfError) {
      console.warn('Hugging Face API error, falling back to prompt only:', hfError);
    }
    
    return NextResponse.json({
      csvData,
      prompt,
      analysis: 'Please use the provided prompt with your preferred AI service.',
      needsApiKey: true
    });
    
  } catch (error) {
    console.error('AI Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI analysis' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';