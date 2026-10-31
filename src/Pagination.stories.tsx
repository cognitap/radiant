import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Pagination,
  PaginationList,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationButton,
  PaginationUnavailable,
  PaginationEllipsis
} from './index.js'
const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    docs: {
      description: {
        component:
          'Named native navigation with URL links or application-owned action buttons. Current page is explicit; unavailable URL boundaries are text, while actions use native disabled buttons. Apps own page labels, routing, page counts, data and focus after content changes. No router or fetching engine is included.'
      }
    }
  }
} satisfies Meta<typeof Pagination>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Pagination>
      <PaginationList>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        {[1, 2, 3].map(page => (
          <PaginationItem key={page}>
            <PaginationLink
              href={`?page=${page}`}
              current={page === 2}
              aria-label={`Page ${page}`}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href="?page=3" />
        </PaginationItem>
      </PaginationList>
    </Pagination>
  )
}
export const FirstAndLastPages: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Pagination aria-label="Search result pages, first page">
        <PaginationList>
          <PaginationItem>
            <PaginationUnavailable>Previous</PaginationUnavailable>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="?page=1"
              current
              aria-label="Page 1"
            >
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="?page=10"
              aria-label="Page 10"
            >
              10
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="?page=2" />
          </PaginationItem>
        </PaginationList>
      </Pagination>
      <Pagination aria-label="Search result pages, last page">
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious href="?page=9" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="?page=1"
              aria-label="Page 1"
            >
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="?page=10"
              current
              aria-label="Page 10"
            >
              10
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationUnavailable>Next</PaginationUnavailable>
          </PaginationItem>
        </PaginationList>
      </Pagination>
    </div>
  )
}
function ClientSideExample() {
  const [page, setPage] = useState(1)
  return (
    <div>
      <p>Showing page {page} of 3</p>
      <Pagination aria-label="Local record pages">
        <PaginationList>
          <PaginationItem>
            <PaginationButton
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </PaginationButton>
          </PaginationItem>
          {[1, 2, 3].map(n => (
            <PaginationItem key={n}>
              <PaginationButton
                current={page === n}
                aria-label={`Page ${n}`}
                onClick={() => setPage(n)}
              >
                {n}
              </PaginationButton>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationButton
              disabled={page === 3}
              onClick={() => setPage(page + 1)}
            >
              Next
            </PaginationButton>
          </PaginationItem>
        </PaginationList>
      </Pagination>
    </div>
  )
}
export const ClientSidePages: Story = { render: () => <ClientSideExample /> }
export const SharedControlSizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {(['small', 'medium', 'large'] as const).map(controlSize => (
        <Pagination
          key={controlSize}
          aria-label={`${controlSize} pages`}
        >
          <PaginationList>
            <PaginationItem>
              <PaginationPrevious
                href="?page=1"
                controlSize={controlSize}
              />
            </PaginationItem>
            {[1, 2, 3].map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  href={`?page=${page}`}
                  controlSize={controlSize}
                  current={page === 2}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="?page=3"
                controlSize={controlSize}
              />
            </PaginationItem>
          </PaginationList>
        </Pagination>
      ))}
    </div>
  )
}
export const Customisation: Story = {
  render: () => (
    <Pagination
      style={{
        width: '14rem',
        '--rad-pagination-gap': '.75rem',
        '--rad-pagination-radius': '999px',
        '--rad-pagination-item-min-width': '2.5rem'
      }}
    >
      <PaginationList>
        {[1, 2, 3].map(page => (
          <PaginationItem key={page}>
            <PaginationLink
              href={`?page=${page}`}
              controlSize="large"
              variant={page === 2 ? 'outline' : 'soft'}
              current={page === 2}
              aria-label={`Page ${page}`}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
      </PaginationList>
    </Pagination>
  )
}
