import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";

export function GoalMetrics({
  data,
}: {
  data: { goal: number; watched: number }[];
}) {
  return (
    <Card className="rounded-md w-full mt-3 border text-white border-white border-opacity-10 bg-orange-600 bg-opacity-1">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Are you hitting your goals?</CardTitle>
        <CardDescription>
          You are consistently reaching your goals. Keep up the good work!
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[220px] flex items-center">
          <ResponsiveContainer width="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 0,
              }}
              height={210}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-md border border-white border-opacity-5 p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground text-orange-400 text-opacity-60">
                              Goal
                            </span>
                            <span className="font-bold text-muted-foreground text-orange-400 text-opacity-60">
                              {payload[0].value}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground text-orange-400">
                              Watched
                            </span>
                            <span className="font-bold text-orange-400">
                              {payload[1].value}
                            </span>
                          </div>
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
                dataKey="goal"
                activeDot={{
                  r: 6,
                  style: { fill: "#3c1f0b", opacity: 0.6 },
                }}
                style={
                  {
                    stroke: "#3c1f0b",
                    opacity: 0.6,
                  } as React.CSSProperties
                }
              />
              <Line
                type="monotone"
                dataKey="watched"
                strokeWidth={2}
                activeDot={{
                  r: 6,
                  style: { fill: "#ef6c00" },
                }}
                style={
                  {
                    stroke: "#ef6c00",
                  } as React.CSSProperties
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
