import { calculateShipping } from "../utils/shipping";

describe("Shipping Calculator - N-Wise Testing", () => {

  test("D1 W1 T1 -> Distance courte, poids léger, standard", () => {
    expect(calculateShipping(10, 5, "standard")).toBe(10);
  });

  test("D1 W2 T2 -> Distance courte, poids lourd, express", () => {
    expect(calculateShipping(10, 20, "express")).toBe(30);
  });

  test("D2 W1 T2 -> Distance moyenne, poids léger, express", () => {
    expect(calculateShipping(100, 5, "express")).toBe(50);
  });

  test("D2 W2 T1 -> Distance moyenne, poids lourd, standard", () => {
    expect(calculateShipping(100, 20, "standard")).toBe(37.5);
  });

  test("D3 W1 T2 -> Distance longue, poids léger, express", () => {
    expect(calculateShipping(600, 5, "express")).toBe(100);
  });

  test("D3 W2 T1 -> Distance longue, poids lourd, standard", () => {
    expect(calculateShipping(600, 20, "standard")).toBe(75);
  });

});