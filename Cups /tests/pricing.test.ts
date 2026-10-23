import { describe, expect, it } from "vitest";
import { estimate, money } from "../app/pricing";
describe("proposal estimates in integer cents", () => {
    it("calculates an editable one-time order", () => expect(estimate(1000, 31, 0)).toEqual({ subtotal: 31000, savings: 0, total: 31000 }));
    it("applies a monthly discount per delivery", () => expect(estimate(1000, 31, 10)).toEqual({ subtotal: 31000, savings: 3100, total: 27900 }));
    it("rounds fractional cents once", () => expect(estimate(251, 33, 7).total).toBe(7703));
    it("formats dollars from cents", () => expect(money(27900)).toBe("$279.00"));
});
