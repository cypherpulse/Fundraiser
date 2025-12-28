import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { initSimnet } from "@stacks/clarinet-sdk";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

describe("fund-raiser simple tests", () => {
  it("should allow basic funding", () => {
    const { result } = simnet.callPublicFn("fund-raiser", "fund", [Cl.uint(100000)], address1);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should return correct balance after funding", () => {
    const balance = simnet.callReadOnlyFn("fund-raiser", "get-balance", [], address1);
    expect(balance.result).toBeUint(100000);
  });

  it("should return correct goal", () => {
    const goal = simnet.callReadOnlyFn("fund-raiser", "get-goal", [], address1);
    expect(goal.result).toBeUint(1000000);
  });

  it("should return correct owner", () => {
    const owner = simnet.callReadOnlyFn("fund-raiser", "get-owner", [], address1);
    expect(owner.result).toBePrincipal(deployer);
  });

  it("should track donor amount", () => {
    const donorAmount = simnet.callReadOnlyFn("fund-raiser", "get-donor-amount", [Cl.principal(address1)], address1);
    expect(donorAmount.result).toBeUint(100000);
  });
});