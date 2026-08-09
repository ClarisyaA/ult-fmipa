"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PerformanceRankingDatum = {
  key: string;
  label: string;
  subtitle: string;
  total: number;
};

type PerformanceRankingChartProps = {
  data: PerformanceRankingDatum[];
  label: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

type TooltipPayload = {
  payload?: PerformanceRankingDatum;
  value?: number;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const current = payload[0]?.payload;

  return (
    <div className="rounded-md border border-[#d8e4d7] bg-white px-3 py-2 shadow-[0_6px_24px_rgba(17,52,39,0.12)]">
      <p className="text-xs font-semibold text-[#173d2d]">{label}</p>
      {current?.subtitle ? (
        <p className="mt-0.5 text-[11px] text-[#7a7166]">{current.subtitle}</p>
      ) : null}
      <p className="mt-1 text-sm font-semibold text-[#2f6b44]">
        {formatNumber(Number(payload[0]?.value ?? 0))} aktivitas
      </p>
    </div>
  );
}

export function PerformanceRankingChart({
  data,
  label,
}: PerformanceRankingChartProps) {
  const chartHeight = Math.max(320, data.length * 44);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setChartWidth(Math.max(0, Math.floor(element.clientWidth)));
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="rounded-md border border-[#e3ddd2] bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#173d2d]">{label}</h3>
          <p className="mt-1 text-[11px] text-[#7a7166]">
            Hover pada batang untuk melihat detail. Semua data ditampilkan dan
            bisa discroll.
          </p>
        </div>
        <div className="rounded-sm border border-[#dce6da] bg-[#f8fbf6] px-2.5 py-1 text-[11px] font-semibold text-[#2f6b44]">
          {formatNumber(data.length)} entri
        </div>
      </div>

      <div className="max-h-[720px] overflow-y-auto overflow-x-hidden pr-2">
        <div
          ref={containerRef}
          className="min-w-0 w-full"
          style={{ height: chartHeight, minHeight: 320 }}
        >
          {chartWidth > 0 ? (
            <BarChart
              width={chartWidth}
              height={chartHeight}
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 20, bottom: 8, left: 12 }}
              barCategoryGap={10}
            >
              <CartesianGrid horizontal={false} stroke="#edf2eb" />
              <XAxis
                type="number"
                tick={{ fill: "#6b6f68", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={240}
                tick={{ fill: "#173d2d", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "rgba(47,107,68,0.06)" }}
                content={<ChartTooltip />}
              />
              <Bar dataKey="total" radius={[0, 999, 999, 0]} barSize={18}>
                {data.map((entry, index) => (
                  <Cell
                    key={entry.key}
                    fill={index < 3 ? "#0f3d2e" : "#2f6b44"}
                    fillOpacity={index < 3 ? 1 : 0.95}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : null}
        </div>
      </div>
    </div>
  );
}
