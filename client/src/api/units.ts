import { apiRequest } from "./client";
import type { Unit } from "./types";

export function listUnits(active?: boolean) {
    return apiRequest<{ units: Unit[] }>("/unit", { query: { active } });
}

export function getUnit(id: number) {
    return apiRequest<Unit>(`/unit/${id}`);
}

export function createUnit(name: string) {
    return apiRequest<Unit>("/unit", { method: "POST", body: { name } });
}

export function updateUnit(id: number, input: { name?: string; active?: boolean }) {
    return apiRequest<Unit>(`/unit/${id}`, { method: "PATCH", body: input });
}
