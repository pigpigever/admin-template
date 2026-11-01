import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Trans } from "@lingui/react/macro";
import { I18nProvider, useI18n } from "@/i18n";

function LocaleProbe() {
  const { locale, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <button type="button" onClick={() => setLocale("zh")}>
        switch
      </button>
      <Trans>Sign In</Trans>
    </div>
  );
}

function renderProbe() {
  return render(
    <I18nProvider>
      <LocaleProbe />
    </I18nProvider>
  );
}

describe("I18nProvider", () => {
  it("renders the source locale by default", () => {
    renderProbe();
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("re-renders translations after switching locale", async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole("button", { name: "switch" }));

    expect(screen.getByTestId("locale")).toHaveTextContent("zh");
    expect(await screen.findByText("登录")).toBeInTheDocument();
  });
});
