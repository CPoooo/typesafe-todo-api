import { vi } from "vitest";

process.env.SECRET_KEY = "test-secret";

vi.spyOn(console, "error").mockImplementation(() => {});