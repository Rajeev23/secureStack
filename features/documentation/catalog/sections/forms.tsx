"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CatalogPreview } from "@/features/documentation/catalog/catalog-preview";

export function CatalogForms() {
  const [role, setRole] = useState("editor");
  const [subscribed, setSubscribed] = useState(true);

  return (
    <>
      <CatalogPreview
        id="input"
        title="Input"
        purpose="Single-line text. Pair every field with a visible Label."
        code={`<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>`}
        notes="Do not use placeholder as the only label. Mark invalid fields with aria-invalid."
      >
        <div className="grid w-full max-w-sm gap-2">
          <Label htmlFor="catalog-email">Email</Label>
          <Input id="catalog-email" type="email" placeholder="you@example.com" autoComplete="email" />
        </div>
      </CatalogPreview>

      <CatalogPreview
        id="textarea"
        title="Textarea"
        purpose="Multi-line text for notes and longer messages."
        code={`<Label htmlFor="notes">Notes</Label>
<Textarea id="notes" placeholder="Add context for your team." />`}
      >
        <div className="grid w-full max-w-sm gap-2">
          <Label htmlFor="catalog-notes">Notes</Label>
          <Textarea id="catalog-notes" placeholder="Add context for your team." />
        </div>
      </CatalogPreview>

      <CatalogPreview
        id="select"
        title="Select"
        purpose="Choose one option from a short list."
        code={`<Select value={role} onValueChange={setRole}>
  <SelectTrigger className="w-44">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Admin</SelectItem>
    <SelectItem value="editor">Editor</SelectItem>
    <SelectItem value="viewer">Viewer</SelectItem>
  </SelectContent>
</Select>`}
      >
        <div className="grid gap-2">
          <Label htmlFor="catalog-role">Role</Label>
          <Select value={role} onValueChange={(value) => {
            if (value) setRole(value);
          }}>
            <SelectTrigger id="catalog-role" className="w-44">
              <SelectValue>
                {role === "admin" ? "Admin" : role === "editor" ? "Editor" : "Viewer"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CatalogPreview>

      <CatalogPreview
        id="checkbox"
        title="Checkbox"
        purpose="Toggle an independent option. Keep the label clickable via htmlFor / id."
        code={`<div className="flex items-center gap-2">
  <Checkbox id="alerts" checked={subscribed} onCheckedChange={setSubscribed} />
  <Label htmlFor="alerts">Email alerts</Label>
</div>`}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            id="catalog-alerts"
            checked={subscribed}
            onCheckedChange={(checked) => setSubscribed(checked === true)}
          />
          <Label htmlFor="catalog-alerts">Email alerts</Label>
        </div>
      </CatalogPreview>
    </>
  );
}
