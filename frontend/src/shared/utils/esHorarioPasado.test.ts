/**
 * Tests for esHorarioPasado — FR-015 (no permitir reservar horarios ya pasados)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { esHorarioPasado } from "./esHorarioPasado";

describe("esHorarioPasado", () => {
  beforeEach(() => {
    // Simulamos: hoy 2024-06-15, ahora 10:30
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:30:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("devuelve true para fecha pasada", () => {
    expect(esHorarioPasado("2024-06-14", "10:00")).toBe(true);
  });

  it("devuelve true para horario pasado de hoy", () => {
    expect(esHorarioPasado("2024-06-15", "10:00")).toBe(true);
    expect(esHorarioPasado("2024-06-15", "09:45")).toBe(true);
  });

  it("devuelve false para horario futuro de hoy", () => {
    expect(esHorarioPasado("2024-06-15", "10:45")).toBe(false);
    expect(esHorarioPasado("2024-06-15", "20:45")).toBe(false);
  });

  it("devuelve false para fecha futura", () => {
    expect(esHorarioPasado("2024-06-16", "08:00")).toBe(false);
    expect(esHorarioPasado("2025-01-01", "10:00")).toBe(false);
  });

  it("devuelve true para mismo instante exacto (ya no reservable)", () => {
    // El slot de 10:30 está pasando AHORA — se considera pasado
    expect(esHorarioPasado("2024-06-15", "10:30")).toBe(true);
  });
});
