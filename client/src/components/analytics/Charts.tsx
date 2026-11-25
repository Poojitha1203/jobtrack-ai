import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip.tsx';
import { AXIS_TICK, CHART_INK, ORDINAL_BLUE, SERIES } from '../../lib/chartTheme.ts';
import type { AnalyticsReport } from '../../types/analytics.ts';

const CURSOR = { fill: '#f1f5f9' };
const percent = (v: number) => `${v}%`;

export function ActivityChart({ data }: { data: AnalyticsReport['byMonth'] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
        <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <Tooltip cursor={CURSOR} content={(props) => <ChartTooltip {...props} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => <span style={{ color: CHART_INK.secondary }}>{value}</span>}
        />
        <Bar dataKey="applications" name="Applications sent" fill={SERIES.primary} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="interviews" name="Interviews" fill={SERIES.secondary} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ResponseRateChart({ data }: { data: AnalyticsReport['byMonth'] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={percent} tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ stroke: CHART_INK.baseline }}
          content={(props) => <ChartTooltip {...props} formatValue={percent} />}
        />
        {/* No connectNulls: a month with no applications is a gap, not a drop to 0%. */}
        <Line
          type="monotone"
          dataKey="responseRate"
          name="Response rate"
          stroke={SERIES.primary}
          strokeWidth={2}
          dot={{ r: 4, fill: SERIES.primary, stroke: '#fff', strokeWidth: 2 }}
          activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface HBarProps<T> {
  data: T[];
  nameKey: keyof T & string;
  valueKey: keyof T & string;
  valueName: string;
  colors?: readonly string[];
  formatValue?: (value: number) => string;
  /** Text after each bar, e.g. "12 (40%)". Defaults to the formatted value. */
  label?: (row: T) => string;
}

/** Horizontal bars — categories are named on the axis, so colour is never needed to tell them apart. */
export function HorizontalBarChart<T extends object>({
  data,
  nameKey,
  valueKey,
  valueName,
  colors,
  formatValue = (v) => v.toLocaleString(),
  label,
}: HBarProps<T>) {
  const height = Math.max(120, data.length * 36 + 24);
  const labelled = data.map((row) => ({
    ...row,
    __label: label ? label(row) : formatValue(Number(row[valueKey])),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={labelled} layout="vertical" margin={{ top: 4, right: 96, left: 0, bottom: 4 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey={nameKey as string}
          width={118}
          tick={{ ...AXIS_TICK, fill: CHART_INK.secondary }}
          tickLine={false}
          axisLine={{ stroke: CHART_INK.baseline }}
        />
        <Tooltip
          cursor={CURSOR}
          content={(props) => <ChartTooltip {...props} formatValue={(v) => formatValue(v)} />}
        />
        <Bar dataKey={valueKey as string} name={valueName} fill={SERIES.primary} radius={[0, 4, 4, 0]} maxBarSize={18}>
          {colors && labelled.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          <LabelList dataKey="__label" position="right" fill={CHART_INK.secondary} fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export const FUNNEL_COLORS = ORDINAL_BLUE;
