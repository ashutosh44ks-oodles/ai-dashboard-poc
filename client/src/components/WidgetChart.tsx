import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WidgetChart as WidgetChartType } from "@/lib/widgetResponse";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

interface WidgetChartProps {
  chart: WidgetChartType;
}

function buildChartConfig(data: WidgetChartType["data"]): ChartConfig {
  const config: ChartConfig = {
    value: { label: "Value", color: CHART_COLORS[0] },
  };
  data.forEach((point, index) => {
    config[point.label] = {
      label: point.label,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });
  return config;
}

const WidgetChart = ({ chart }: WidgetChartProps) => {
  const chartConfig = buildChartConfig(chart.data);
  const data = chart.data.map((d) => ({ label: d.label, value: d.value }));
  const radarData = chart.data.map((d) => ({
    subject: d.label,
    value: d.value,
  }));

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">{chart.title}</h4>

      <ChartContainer config={chartConfig} className="mx-auto h-[220px] w-full">
        {chart.type === "pie" && (
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={50}
              outerRadius={80}
              strokeWidth={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="label" />} />
          </PieChart>
        )}

        {chart.type === "line" && (
          <LineChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        )}

        {chart.type === "area" && (
          <AreaChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="value"
              fill="var(--color-value)"
              fillOpacity={0.3}
              stroke="var(--color-value)"
              strokeWidth={2}
            />
          </AreaChart>
        )}

        {chart.type === "radar" && (
          <RadarChart data={radarData} outerRadius={80}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar
              dataKey="value"
              fill="var(--color-value)"
              fillOpacity={0.4}
              stroke="var(--color-value)"
            />
          </RadarChart>
        )}

        {chart.type === "radial" && (
          <RadialBarChart
            data={data}
            innerRadius={30}
            outerRadius={90}
            startAngle={180}
            endAngle={0}
          >
            <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
            <RadialBar dataKey="value" background cornerRadius={4}>
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </RadialBar>
          </RadialBarChart>
        )}

        {(chart.type === "bar" ||
          !["pie", "line", "area", "radar", "radial"].includes(chart.type)) && (
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ChartContainer>
    </div>
  );
};

export default WidgetChart;
