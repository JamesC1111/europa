"use strict";

(() => {
  const countySlug = new URLSearchParams(window.location.search).get("county");
  const profile = document.querySelector("[data-county-profile]");
  const contributions = document.querySelector("[data-approved-contributions]");

  function showMessage(container, message) {
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    container.replaceChildren(paragraph);
  }

  function contributionCard(item) {
    const article = document.createElement("article");
    article.className = "contribution-card";
    const title = document.createElement("h3");
    title.textContent = item.title || "Community contribution";
    const text = document.createElement("p");
    text.textContent = item.contribution;
    article.append(title, text);
    if (item.sourceUrl) {
      const source = document.createElement("a");
      source.className = "text-link";
      source.href = item.sourceUrl;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.textContent = "View source";
      article.append(source);
    }
    return article;
  }

  async function initialiseProfile() {
    if (!countySlug) {
      showMessage(profile, "Choose a county from the atlas to open its profile.");
      return;
    }
    try {
      const [countyResponse, contributionResponse] = await Promise.all([
        fetch("../data/counties.json"),
        fetch("../data/approved-contributions.json"),
      ]);
      if (!countyResponse.ok || !contributionResponse.ok) throw new Error("Profile data unavailable");
      const [{ counties }, { contributions: allContributions }] = await Promise.all([
        countyResponse.json(),
        contributionResponse.json(),
      ]);
      const county = counties.find((item) => item.slug === countySlug);
      if (!county) throw new Error("Unknown county");
      document.title = `${county.name} and ${county.officialUmbrellaPairing.partnerCountry} | Europa Society at UCC`;
      profile.replaceChildren();
      const label = document.createElement("p");
      label.className = "eyebrow";
      label.textContent = "County Pairing";
      const heading = document.createElement("h1");
      heading.textContent = `${county.name} × ${county.officialUmbrellaPairing.partnerCountry}`;
      const text = document.createElement("p");
      text.className = "hero-intro";
      text.textContent = `${county.name} is paired with ${county.officialUmbrellaPairing.partnerCountry}. Explore approved community contributions or share a discovery for review.`;
      profile.append(label, heading, text);
      if (county.slug === "cork") {
        const researchPreview = document.createElement("a");
        researchPreview.className = "button button-secondary";
        researchPreview.href = "../pairings/cork-france/";
        researchPreview.textContent = "Open Cork–France research preview";
        profile.append(researchPreview);
      }
      const approved = allContributions.filter(
        (item) => item.county === county.slug && item.approvalStatus === "approved",
      );
      if (!approved.length) {
        showMessage(contributions, "No approved contributions have been added to this profile yet.");
        return;
      }
      contributions.replaceChildren(...approved.map(contributionCard));
    } catch (error) {
      showMessage(profile, "This county profile could not be loaded. Please return to the atlas and try again.");
      showMessage(contributions, "Approved contributions are unavailable right now.");
      console.error("County profile failed to load:", error);
    }
  }

  initialiseProfile();
})();
