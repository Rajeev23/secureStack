"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogPreview } from "@/features/documentation/catalog/catalog-preview";

export function CatalogActions() {
  return (
    <>
      <CatalogPreview
        id="button"
        title="Button"
        purpose="Triggers an action. Use a real button, not a clickable div."
        code={`<Button>Save changes</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete</Button>`}
        notes="Icon-only buttons need an accessible name via aria-label or visually hidden text."
      >
        <Button>Save changes</Button>
        <Button variant="outline">Cancel</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="link">Learn more</Button>
      </CatalogPreview>

      <CatalogPreview
        id="variants"
        title="Variants"
        purpose="default is the primary call to action. outline and ghost are secondary. destructive is for irreversible actions."
        code={`<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>`}
      >
        <Button variant="default">Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </CatalogPreview>

      <CatalogPreview
        id="sizes"
        title="Sizes"
        purpose="Match density to the surrounding layout. sm for toolbars, default for forms. pill is marketing CTAs only — app chrome stays 6px."
        code={`<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>
<Button size="pill">Start Deploying</Button>
<Button size="icon" aria-label="Send email">
  <Mail />
</Button>`}
      >
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="pill">Start Deploying</Button>
        <Button size="icon" aria-label="Send email">
          <Mail />
        </Button>
      </CatalogPreview>

      <CatalogPreview
        id="states"
        title="States"
        purpose="Disabled buttons are not focusable and must not look tappable."
        code={`<Button disabled>Saving…</Button>`}
      >
        <Button disabled>Saving…</Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
      </CatalogPreview>
    </>
  );
}
