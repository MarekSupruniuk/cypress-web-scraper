const readOfferRow = (row: JQuery<HTMLElement>) => {
  const id = row.data("id");
  const name = row.find("p.title > strong").text();
  const sourceUrl = row.find(".sourceButton").attr("href");
  const area = row
    .find(".element > .row:nth-child(2) > .point:nth-of-type(2)")
    .text()
    .trim();
  const type = row
    .find("div:nth-child(1) > .row > div > small:nth-of-type(2)")
    .text()
    .trim();
  const phoneNumber = "no phone";

  return {
    id,
    name,
    phoneNumber,
    sourceUrl,
    area,
    type,
  };
};

const readPagesCount = (element: HTMLElement) =>
  parseInt(element.textContent.split("/")[1].trim(), 10);

describe("Read data", () => {
  it("Just read", () => {
    cy.visit(Cypress.env("host"));

    // Login
    cy.get("#UserEmail").type(Cypress.env("username"));
    cy.get("#UserPassword").type(Cypress.env("password"));

    cy.contains("Zaloguj się").click();

    // Make sure page was redirected to /Offers
    cy.url().should("include", "/Offers");

    // Close modal overlay
    cy.get("#datapickerGlass").click({ force: true });

    // Fill up filter fields & search
    cy.get("#city").type("białostocki");
    cy.get(".ac_results.city ul li:first-of-type").click();

    cy.get("#object").select(["Mieszkanie", "Komercyjny"], { force: true });

    cy.get('button[type="submit"]').contains("Wyszukaj").click();

    // Read pages count
    cy.get("label[data-limit]").then((element) => {
      // Get total pages count
      const pagesCount = readPagesCount(element[0]);

      const processPage = (page: number, data: any[]) => {
        // Set page
        cy.get('input[data-link="paginator"]')
          .clear()
          .type(page + "{enter}");

        // Wait for record list to be refreshed
        cy.wait(2000);

        // Read rows data
        cy.get(".row.offer.hidden-xs")
          .each((row) => {
            const result = readOfferRow(row);
            data.push(result);
          })
          .then(() => {
            if (page < pagesCount) {
              processPage(page + 1, data);
            } else {
              console.log(data.length);
              console.log(data);
            }
          });
      };

      processPage(1, []);
    });
  });
});
