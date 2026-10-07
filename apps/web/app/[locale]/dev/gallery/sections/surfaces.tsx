"use client"

import { useFormat } from "@/lib/use-format"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { StatTile } from "@workspace/ui/components/stat-tile"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { Demo } from "../demo"

export function SurfacesSection() {
  const format = useFormat()

  return (
    <div className="flex flex-col gap-8">
      <Demo title="Card · default, interactive, selected, hero, sunken">
        <Card className="w-72">
          <CardHeader>
            <CardTitle>Leave balance</CardTitle>
            <CardDescription>Annual leave · 2026</CardDescription>
            <CardAction>
              <Button variant="ghost" size="xs">
                Details
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-body">14 days available</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Request leave</Button>
          </CardFooter>
        </Card>
        <Card variant="interactive" asChild className="w-72">
          <a href="#surfaces">
            <CardTitle>Leave requests</CardTitle>
            <CardDescription>3 waiting for you</CardDescription>
          </a>
        </Card>
        <Card variant="selected" className="w-56">
          <CardTitle>Full day</CardTitle>
          <CardDescription>08:00 – 16:00</CardDescription>
        </Card>
        <Card variant="hero" className="w-72">
          <CardTitle>Today</CardTitle>
          <CardDescription>Not yet checked in</CardDescription>
        </Card>
        <Card variant="sunken" className="w-56">
          <CardDescription>Reason: family event</CardDescription>
        </Card>
      </Demo>

      <Demo title="Stat tile · default, link, hero, unknown, loading">
        <StatTile
          className="w-56"
          label="Present"
          value={182}
          formattedValue={format.number(182)}
          formattedTotal={format.number(204)}
          markerClassName="bg-status-present"
          delta={{ text: "3% vs last Tue", direction: "up", tone: "success" }}
        />
        <StatTile
          className="w-56"
          label="Late"
          value={11}
          formattedValue={format.number(11)}
          markerClassName="bg-status-late"
          delta={{ text: "4 more than avg", direction: "up", tone: "error" }}
          link={(children, className) => (
            <a href="#surfaces" className={className}>
              {children}
            </a>
          )}
        />
        <StatTile
          className="w-56"
          label="Pending approvals"
          value={7}
          formattedValue={format.number(7)}
          variant="hero"
        />
        <StatTile
          className="w-56"
          label="On Leave"
          value={null}
          markerClassName="bg-status-leave"
        />
        <StatTile className="w-56" label="Absent" value={0} loading />
      </Demo>

      <Demo title="Tabs · with counts, disabled">
        <Tabs defaultValue="pending" className="w-full max-w-xl">
          <TabsList>
            <TabsTrigger value="pending" count={7} aria-label="Pending, 7">
              Pending
            </TabsTrigger>
            <TabsTrigger value="decided">Decided</TabsTrigger>
            <TabsTrigger
              value="corrections"
              count={5}
              attention
              aria-label="Corrections, 5"
            >
              Corrections
            </TabsTrigger>
            <TabsTrigger value="archive" disabled>
              Archive
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            7 requests are waiting for you.
          </TabsContent>
          <TabsContent value="decided">
            Requests you decided in the last 30 days.
          </TabsContent>
          <TabsContent value="corrections">
            5 corrections need review.
          </TabsContent>
        </Tabs>
      </Demo>
    </div>
  )
}
