import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  ChartDataTable,
  type ChartDatum
} from '@cognitap/radiant/charts'
const data: ChartDatum[] = [{ key: 'one', label: 'Round 1', values: { sessions: 12 } }],
  series = [{ key: 'sessions', label: 'Sessions' }]
export const charts = (
  <>
    <LineChart
      label="Sessions"
      data={data}
      series={series}
    />
    <BarChart
      label="Sessions"
      data={data}
      series={series}
    />
    <AreaChart
      label="Sessions"
      data={data}
      series={series}
    />
    <PieChart
      label="Sessions"
      data={data}
      series={[series[0]!]}
    />
    <ChartDataTable
      label="Data"
      data={data}
      series={series}
    />
  </>
)
