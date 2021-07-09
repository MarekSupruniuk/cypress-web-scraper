import { parse } from "json2csv";

const fields = ["id", "name", "phoneNumber", "sourceUrl", "area", "type"];

type OfferRecord = {
  id: number;
  name: string;
  phoneNumber: string;
  sourceUrl: string;
  area: string;
  type: string;
};

const readOfferRow = (row: JQuery<HTMLElement>): OfferRecord => {
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
  // const phoneNumber = row.find(".showed-phone em:nth-of-type(1)").text().trim();
  const phoneNumber = '-- empty --';

  return {
    id,
    name,
    phoneNumber,
    sourceUrl,
    area,
    type,
  };
};

const readPagesCount = (element: HTMLElement): number =>
  parseInt(element.textContent.split("/")[1].trim(), 10);

const writeToFile = (data: OfferRecord[]) => {
  try {
    const csv = parse(data, { fields });
    cy.writeFile(Cypress.env("filename"), csv);
  } catch (err) {
    console.error(err);
  }
}

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
    cy.get("#city").type(Cypress.env("cityValue"));
    cy.get(".ac_results.city ul li:first-of-type").click();

    cy.get("#object").select(Cypress.env("objectValue").split(","), {
      force: true,
    });

    cy.get("#action").select(Cypress.env("actionValue").split(","), {
      force: true,
    });

    cy.get("#date").select(Cypress.env("dateValue"), {
      force: true,
    });

    cy.get('button[type="submit"]').contains("Wyszukaj").click();

    // Read pages count
    cy.get("label[data-limit]").then((element) => {
      // Get total pages count
      const pagesCount = readPagesCount(element[0]);

      const processPage = (page: number, data: OfferRecord[]) => {
        // Set page
        cy.get('input[data-link="paginator"]')
          .clear()
          .type(page + "{enter}");

        // Wait for record list to be refreshed
        cy.wait(2000);

        // Display phone numbers for each row
        // cy.get(".row.offer.hidden-xs .phone-contact:not(.showed-phone)").click({
        //   force: true,
        //   multiple: true,
        // });

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
              writeToFile(data);
            }
          });
      };

      processPage(1, []);
    });
  });
});
