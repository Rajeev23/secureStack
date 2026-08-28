"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogPreview } from "@/features/documentation/catalog/catalog-preview";

export function CatalogNavigation() {
  return (
    <>
      <CatalogPreview
        id="tabs"
        title="Tabs"
        purpose="Switch between peer views in the same page. Keep the selected tab obvious."
        code={`<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="members">Members</TabsTrigger>
  </TabsList>
  <TabsContent value="general">Workspace defaults.</TabsContent>
  <TabsContent value="members">Member list.</TabsContent>
</Tabs>`}
      >
        <Tabs defaultValue="general" className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-3 text-muted-foreground">
            Workspace defaults.
          </TabsContent>
          <TabsContent value="members" className="mt-3 text-muted-foreground">
            Member list.
          </TabsContent>
          <TabsContent value="preferences" className="mt-3 text-muted-foreground">
            Layout, color mode, and notifications.
          </TabsContent>
        </Tabs>
      </CatalogPreview>

      <CatalogPreview
        id="breadcrumb"
        title="Breadcrumb"
        purpose="Orient the user in a hierarchy three or more levels deep. The last item is the current page."
        code={`<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/settings/company">Company</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Settings</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/settings/company">Company</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </CatalogPreview>
    </>
  );
}
