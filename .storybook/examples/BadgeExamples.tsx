import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type BadgeProps
} from '../../src/index.js'
export type BadgeTaskOptions = Pick<BadgeProps, 'className' | 'style'>
const releases = [
  { name: 'Onboarding survey', owner: 'Mira', tone: 'neutral', status: 'Draft' },
  { name: 'Reader study', owner: 'Tomás', tone: 'accent', status: 'Approved' },
  { name: 'Pricing interviews', owner: 'Ade', tone: 'warning', status: 'Needs review' },
  { name: 'Checkout redesign', owner: 'Lena', tone: 'danger', status: 'Blocked' }
] as const
export function ReleaseStatusTable(props: BadgeTaskOptions) {
  return (
    <div style={{ width: '32rem', maxWidth: '100%' }}>
      <Table>
        <TableCaption>Study releases</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeader>Study</TableHeader>
            <TableHeader>Owner</TableHeader>
            <TableHeader>Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {releases.map(release => (
            <TableRow key={release.name}>
              <TableCell>{release.name}</TableCell>
              <TableCell>{release.owner}</TableCell>
              <TableCell>
                <Badge
                  {...props}
                  tone={release.tone}
                >
                  {release.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
export function SectionCounts(props: BadgeTaskOptions) {
  return (
    <div style={{ display: 'grid', gap: '.75rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: 0 }}>
        Open reviews <Badge {...props}>12</Badge>
      </h2>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: 0 }}>
        Interview notes{' '}
        <Badge
          {...props}
          tone="accent"
        >
          New
        </Badge>
      </h2>
    </div>
  )
}
export function RepeatedStatus(props: BadgeTaskOptions) {
  return (
    <p>
      Release approved.{' '}
      <Badge
        {...props}
        decorative
        tone="accent"
      >
        Approved
      </Badge>
    </p>
  )
}
