import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { initSimnet } from "@stacks/clarinet-sdk";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

describe("fund-raiser contract", () => {
  it("should allow funding", () => {
    const { result } = simnet.callPublicFn("fund-raiser", "fund", [Cl.uint(500000)], address1);
    expect(result).toBeOk(Cl.bool(true));

    const balance = simnet.callReadOnlyFn("fund-raiser", "get-balance", [], address1);
    expect(balance.result).toBeUint(500000);

    const donorAmount = simnet.callReadOnlyFn("fund-raiser", "get-donor-amount", [Cl.principal(address1)], address1);
    expect(donorAmount.result).toBeUint(500000);
  });

  it("should not allow funding with zero amount", () => {
    const { result } = simnet.callPublicFn("fund-raiser", "fund", [Cl.uint(0)], address1);
    expect(result).toBeErr(Cl.uint(1));
  });

  it("should allow multiple donations", () => {
    simnet.callPublicFn("fund-raiser", "fund", [Cl.uint(300000)], address2);
    simnet.callPublicFn("fund-raiser", "fund", [Cl.uint(200000)], address1);

    const balance = simnet.callReadOnlyFn("fund-raiser", "get-balance", [], address1);
    expect(balance.result).toBeUint(500000); // 300k + 200k

    const donor1 = simnet.callReadOnlyFn("fund-raiser", "get-donor-amount", [Cl.principal(address1)], address1);
    expect(donor1.result).toBeUint(200000);

    const donor2 = simnet.callReadOnlyFn("fund-raiser", "get-donor-amount", [Cl.principal(address2)], address1);
    expect(donor2.result).toBeUint(300000);
  });

  it("should not allow withdraw before goal is reached", () => {
    simnet.callPublicFn("fund-raiser", "fund", [Cl.uint(500000)], address1); // less than 1M
    const { result } = simnet.callPublicFn("fund-raiser", "withdraw", [], deployer);
    expect(result).toBeErr(Cl.uint(3)); // Goal not reached
  });

  it("should allow withdraw after goal is reached by owner", () => {
    simnet.callPublicFn("fund-raiser", "fund", [Cl.uint(1000000)], address1);
    const { result } = simnet.callPublicFn("fund-raiser", "withdraw", [], deployer);
    expect(result).toBeOk(Cl.bool(true));

    const balance = simnet.callReadOnlyFn("fund-raiser", "get-balance", [], deployer);
    expect(balance.result).toBeUint(0);
  });

  it("should not allow withdraw by non-owner", () => {
    simnet.callPublicFn("fund-raiser", "fund", [Cl.uint(1000000)], address1);
    const { result } = simnet.callPublicFn("fund-raiser", "withdraw", [], address1);
    expect(result).toBeErr(Cl.uint(2)); // Unauthorized
  });

  it("should return correct goal and owner", () => {
    const goal = simnet.callReadOnlyFn("fund-raiser", "get-goal", [], address1);
    expect(goal.result).toBeUint(1000000);

    const owner = simnet.callReadOnlyFn("fund-raiser", "get-owner", [], address1);
    expect(owner.result).toBePrincipal(deployer);
  });
});