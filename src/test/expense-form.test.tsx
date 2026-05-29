import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpenseForm } from "@/components/app/expense-form";

describe("ExpenseForm", () => {
  it("renders the fast amount entry and save button", () => {
    render(<ExpenseForm />);
    expect(screen.getByLabelText(/expense amount/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });
});
