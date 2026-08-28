"use client";

import { useState } from "react";
import { Archive, Ban, CircleCheck, CircleDashed, Loader, Pause } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TableStatus,
  TableStatusSelect,
  type TableStatusMap,
} from "@/components/shared/table-status";
import { CatalogPreview } from "@/features/documentation/catalog/catalog-preview";

const rows = [
  { name: "Acme Inc.", status: "Active", members: 12, updated: "2 min ago" },
  { name: "Example Corp", status: "Active", members: 8, updated: "10 min ago" },
  { name: "Demo Workspace", status: "Paused", members: 4, updated: "1 hour ago" },
];

const LIFECYCLE_STATUS = {
  active: {
    label: "Active",
    icon: CircleCheck,
    iconClassName: "fill-green-500 text-background dark:fill-green-400",
  },
  paused: { label: "Paused", icon: Pause, iconClassName: "text-amber-500" },
  archived: { label: "Archived", icon: Archive, iconClassName: "text-muted-foreground" },
} as const satisfies TableStatusMap<"active" | "paused" | "archived">;

const WORK_STATUS = {
  Done: {
    label: "Done",
    icon: CircleCheck,
    iconClassName: "fill-green-500 text-background dark:fill-green-400",
  },
  "In Progress": { label: "In Progress", icon: Loader, iconClassName: "text-muted-foreground" },
  "Not Started": { label: "Not Started", icon: CircleDashed, iconClassName: "text-muted-foreground" },
} as const satisfies TableStatusMap<"Done" | "In Progress" | "Not Started">;

const BOOLEAN_STATUS = {
  true: {
    label: "Yes",
    icon: CircleCheck,
    iconClassName: "fill-green-500 text-background dark:fill-green-400",
  },
  false: { label: "No", icon: Ban, iconClassName: "text-red-500" },
} as const satisfies TableStatusMap<"true" | "false">;

export function CatalogDataDisplay() {
  const [workStatus, setWorkStatus] = useState<"Done" | "In Progress" | "Not Started">(
    "In Progress",
  );

  return (
    <>
      <CatalogPreview
        id="badge"
        title="Badge"
        purpose="Short status or category labels. Do not rely on color alone."
        code={`<Badge>Active</Badge>
<Badge variant="secondary">Team</Badge>
<Badge variant="destructive">Paused</Badge>
<Badge variant="outline">Archived</Badge>`}
      >
        <Badge>Active</Badge>
        <Badge variant="secondary">Team</Badge>
        <Badge variant="destructive">Paused</Badge>
        <Badge variant="outline">Archived</Badge>
      </CatalogPreview>

      <CatalogPreview
        id="table-status"
        title="Table status"
        purpose="Map-driven status for tables and forms. Swap the map to change names, icons, and colors — lifecycle, work progress, or true/false."
        code={`const WORK_STATUS = {
  Done: { label: "Done", icon: CircleCheck, iconClassName: "fill-green-500 text-background dark:fill-green-400" },
  "In Progress": { label: "In Progress", icon: Loader },
  "Not Started": { label: "Not Started", icon: CircleDashed },
} as const satisfies TableStatusMap<"Done" | "In Progress" | "Not Started">

<TableStatus value={row.status} options={WORK_STATUS} />
<TableStatusSelect id="status" value={status} options={WORK_STATUS} onValueChange={setStatus} />`}
        notes="Pass the same options object to TableStatus (cell) and TableStatusSelect (form). Boolean columns use true/false keys."
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <TableStatus value="active" options={LIFECYCLE_STATUS} />
            <TableStatus value="paused" options={LIFECYCLE_STATUS} />
            <TableStatus value="archived" options={LIFECYCLE_STATUS} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TableStatus value="Done" options={WORK_STATUS} />
            <TableStatus value="In Progress" options={WORK_STATUS} />
            <TableStatus value="Not Started" options={WORK_STATUS} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TableStatus value={true} options={BOOLEAN_STATUS} />
            <TableStatus value={false} options={BOOLEAN_STATUS} />
          </div>
          <div className="grid max-w-xs gap-2">
            <Label htmlFor="catalog-status">Status</Label>
            <TableStatusSelect
              id="catalog-status"
              value={workStatus}
              options={WORK_STATUS}
              onValueChange={setWorkStatus}
            />
          </div>
        </div>
      </CatalogPreview>

      <CatalogPreview
        id="avatar"
        title="Avatar"
        purpose="Identify a person. Always provide a fallback with initials."
        code={`<Avatar>
  <AvatarFallback>RJ</AvatarFallback>
</Avatar>`}
      >
        <Avatar>
          <AvatarFallback>RJ</AvatarFallback>
        </Avatar>
        <Avatar size="sm">
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>EC</AvatarFallback>
        </Avatar>
      </CatalogPreview>

      <CatalogPreview
        id="card"
        title="Card"
        purpose="Group related content. Use for metrics, settings sections, and empty states."
        code={`<Card>
  <CardHeader>
    <CardTitle as="h2">Components</CardTitle>
    <CardDescription>Placeholder until a repository or SBOM is connected.</CardDescription>
  </CardHeader>
  <CardContent>Replace this body with your feature UI.</CardContent>
</Card>`}
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle as="h2">Components</CardTitle>
            <CardDescription>Placeholder until a repository or SBOM is connected.</CardDescription>
          </CardHeader>
          <CardContent>Replace this body with your feature UI.</CardContent>
        </Card>
      </CatalogPreview>

      <CatalogPreview
        id="table"
        title="Table"
        purpose="Display structured records on inventory, findings, and project lists."
        code={`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Members</TableHead>
      <TableHead>Updated</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>{/* rows */}</TableBody>
</Table>`}
        notes="Product lists (inventory, findings, scans) use this primitive plus page-level filters."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell className="tabular-nums">{row.members}</TableCell>
                <TableCell className="text-muted-foreground">{row.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CatalogPreview>
    </>
  );
}
