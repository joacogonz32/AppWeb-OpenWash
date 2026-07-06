/**
 * Tests for fecha.ts — generarSlots, formatearFecha
 * FR-012: grilla de 08:00 a 20:45 cada 15 min (52 slots)
 */
import { describe, it, expect } from "vitest";
import { generarSlots, formatearFecha, hoy } from "./fecha";

describe("generarSlots", () => {
  it("genera exactamente 52 slots", () => {
    const slots = generarSlots();
    expect(slots).toHaveLength(52);
  });

  it("el primer slot es 08:00", () => {
    expect(generarSlots()[0]).toBe("08:00");
  });

  it("el último slot es 20:45", () => {
    const slots = generarSlots();
    expect(slots[slots.length - 1]).toBe("20:45");
  });

  it("todos los slots tienen formato HH:MM", () => {
    const regex = /^\d{2}:\d{2}$/;
    for (const slot of generarSlots()) {
      expect(slot).toMatch(regex);
    }
  });

  it("los intervalos son de 15 minutos", () => {
    const slots = generarSlots();
    for (let i = 1; i < slots.length; i++) {
      const [h1, m1] = slots[i - 1].split(":").map(Number);
      const [h2, m2] = slots[i].split(":").map(Number);
      const minutos1 = h1 * 60 + m1;
      const minutos2 = h2 * 60 + m2;
      expect(minutos2 - minutos1).toBe(15);
    }
  });
});

describe("formatearFecha", () => {
  it("convierte YYYY-MM-DD a formato dd/mm/yyyy para Argentina", () => {
    expect(formatearFecha("2024-06-15")).toBe("15/06/2024");
    expect(formatearFecha("2024-01-05")).toBe("05/01/2024");
  });
});

describe("hoy", () => {
  it("devuelve formato YYYY-MM-DD", () => {
    expect(hoy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
