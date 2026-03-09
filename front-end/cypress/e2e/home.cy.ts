describe("Home Page", () => {
    beforeEach(() => { cy.visit("/") });

    it("displays the header on load", () => {
        cy.get("h1").should("be.visible");
        cy.get("h1").should("have.text", "Hi-Res Meta Cleaner");
    })
});