export function findingIdentity(input: {
  componentName: string;
  ecosystem: string | null | undefined;
  findingType: string;
  externalReference: string | null | undefined;
}): string {
  return [
    input.componentName.toLowerCase(),
    (input.ecosystem ?? "").toLowerCase(),
    input.findingType,
    input.externalReference ?? "",
  ].join("\0");
}
