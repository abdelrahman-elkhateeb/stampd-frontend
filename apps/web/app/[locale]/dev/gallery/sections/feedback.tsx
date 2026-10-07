"use client"

import { CalendarDaysIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { ErrorState } from "@workspace/ui/components/error-state"
import {
  Skeleton,
  SkeletonGroup,
  TableSkeleton,
} from "@workspace/ui/components/skeleton"

import { Demo } from "../demo"

const box = "w-80 rounded-lg border border-border bg-card"

export function FeedbackSection() {
  return (
    <div className="flex flex-col gap-8">
      <Demo title="Empty state · first-use, caught-up, filtered, no-data, compact">
        <div className={box}>
          <EmptyState
            variant="first-use"
            title="No requests yet"
            body="Requests you send for leave, WFH or trips show up here."
            action={<Button variant="brand">New request</Button>}
          />
        </div>
        <div className={box}>
          <EmptyState
            variant="caught-up"
            title="You're all caught up"
            body="No requests are waiting for you."
            action={<Button variant="link">See decided requests</Button>}
          />
        </div>
        <div className={box}>
          <EmptyState
            variant="filtered"
            title="No results"
            body="Try a different name or remove a filter."
            action={
              <Button variant="outline" size="sm">
                Clear filters
              </Button>
            }
          />
        </div>
        <div className={box}>
          <EmptyState
            variant="no-data"
            icon={CalendarDaysIcon}
            title="No holidays this month"
            body="Holidays you add in settings appear here."
          />
        </div>
        <div className={`${box} px-4`}>
          <EmptyState
            variant="compact"
            title="No notifications"
            body="We'll let you know when something needs you."
          />
        </div>
      </Demo>

      <Demo title="Skeleton · text, avatar, chip, card, table rows (appear after 300 ms)">
        <SkeletonGroup
          label="Loading profile"
          className={`${box} flex items-center gap-3 p-4`}
        >
          <Skeleton className="size-10 rounded-pill" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3.5 w-2/5" />
          </div>
          <Skeleton className="h-chip w-16 rounded-pill" />
        </SkeletonGroup>
        <SkeletonGroup label="Loading balance" className="w-80">
          <Skeleton className="h-32 rounded-lg" />
        </SkeletonGroup>
        <div className={`${box} w-full max-w-xl overflow-hidden`}>
          <TableSkeleton columns={4} rows={4} label="Loading employees" />
        </div>
      </Demo>

      <Demo title="Error state · section, inline, offline">
        <div className={box}>
          <ErrorState
            title="Couldn't load team attendance"
            body="The rest of the page still works."
            code="req_7f3a91"
            actions={<Button size="sm">Try again</Button>}
          />
        </div>
        <ErrorState
          variant="inline"
          className="w-full max-w-xl"
          title="Couldn't save."
          body="Check your connection and try again."
          actions={
            <Button variant="link" size="xs">
              Retry
            </Button>
          }
        />
        <ErrorState
          variant="offline"
          className="w-full max-w-xl"
          title="You're offline."
          body="We'll retry when you're back online."
        />
      </Demo>
    </div>
  )
}
