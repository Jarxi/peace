"use client"

import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartSeriesDefinition } from '@/lib/data/traffic';

interface KeyMetricsChartProps {
  data: Array<Record<string, string | number>>
  series: ChartSeriesDefinition[]
}

const KeyMetricsChart: React.FC<KeyMetricsChartProps> = ({ data, series }) => {
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set())
  const handleLegendClick = (source: string) => {
    setHiddenSources((prev) => {
      const next = new Set(prev)
      if (next.has(source)) {
        next.delete(source)
      } else {
        next.add(source)
      }
      return next
    })
  }

  const legendPayload = useMemo(
    () =>
      series.map(({ source, label, color }) => ({
        value: source,
        label,
        color,
      })),
    [series],
  )

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: -10,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              borderColor: '#d1d5db',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: '#374151' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#374151' }}
            payload={legendPayload}
            content={({ payload }) => {
              if (!payload) {
                return null
              }
              return (
                <ul className='flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600'>
                  {payload.map((entry) => {
                    const source = entry.value as string
                    const isHidden = hiddenSources.has(source)
                    return (
                      <li
                        key={source}
                        onClick={() => handleLegendClick(source)}
                        className={isHidden ? 'flex cursor-pointer items-center gap-2 opacity-40' : 'flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80'}
                      >
                        <span
                          className="inline-block h-2 w-4 rounded"
                          style={{ backgroundColor: entry.color as string }}
                        />
                        {legendPayload.find((item) => item.value === source)?.label ?? source}
                      </li>
                    )
                  })}
                </ul>
              )
            }}
          />
          {series.map(({ source, label, color }) => (
            <Line
              key={source}
              type='monotone'
              dataKey={source}
              name={label}
              stroke={color}
              strokeWidth={2}
              dot={false}
              hide={hiddenSources.has(source)}
              strokeOpacity={hiddenSources.has(source) ? 0 : 1}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default KeyMetricsChart;
