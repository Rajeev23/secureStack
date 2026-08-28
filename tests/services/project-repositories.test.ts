import { describe, expect, it } from "vitest";
import { primaryRepositories } from "@/services/api/project-repositories";

describe("primaryRepositories", () => {
  it("returns an empty array when there is no repository", () => {
    expect(primaryRepositories(undefined)).toEqual([]);
    expect(primaryRepositories(null)).toEqual([]);
    expect(primaryRepositories([])).toEqual([]);
  });

  it("keeps only the first repository", () => {
    expect(primaryRepositories(["acme/app", "acme/other"])).toEqual(["acme/app"]);
    expect(primaryRepositories(["acme/app"])).toEqual(["acme/app"]);
  });
});
