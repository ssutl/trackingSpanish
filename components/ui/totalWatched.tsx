import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export function TotalTimeStats({
  data,
  formattedTime,
}: {
  data: { date: string; watched: number }[];
  formattedTime: string;
}) {
  return (
    <Card className="rounded-md w-full mt-3 border text-white border-white border-opacity-10 bg-orange-600 bg-opacity-1">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Total watched</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-2xl font-bold">{formattedTime}</div>
        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
        <div className="h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-md border border-white border-opacity-5 p-2 shadow-sm">
                        <div className="text-xs text-white">
                          Minutes: {payload[0].value} mins
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="watched"
                activeDot={{
                  r: 6,
                  style: { fill: "#3c1f0b", opacity: 0.6 },
                }}
                style={{
                  stroke: "#3c1f0b",
                  opacity: 0.6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
