(() => {
  "use strict";

  const body = document.body;
  const root = body.dataset.root || "";
  const toast = document.querySelector("[data-toast]");
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  function initialiseSharing() {
    const buttons = document.querySelectorAll("[data-share]");
    for (const button of buttons) {
      button.addEventListener("click", async () => {
        const shareData = {
          title: document.title,
          text: "Explore Europa Society at UCC’s evidence-led county pairings atlas.",
          url: window.location.href,
        };
        try {
          if (navigator.share) {
            await navigator.share(shareData);
            return;
          }
          await copyText(shareData.url);
          showToast("Link copied—ready to share.");
        } catch (error) {
          if (error?.name !== "AbortError") {
            showToast("Sharing was not available. You can copy the page address.");
          }
        }
      });
    }
  }

  function countyDescription(county) {
    if (county.profileStatus === "published-prototype") {
      return {
        statusClass: "status-verified",
        status: "County Pairing",
        title: `${county.name} × ${county.officialUmbrellaPairing.partnerCountry}`,
        text: "",
      };
    }
    return {
      statusClass: "status-unassigned",
      status: "Not yet recorded",
      title: `${county.name} × ${county.officialUmbrellaPairing.partnerCountry}`,
      text: "No contributions have been added to the atlas yet.",
    };
  }

  function renderCountyResult(container, county) {
    const description = countyDescription(county);
    container.replaceChildren();

    const status = document.createElement("span");
    status.className = `status ${description.statusClass}`;
    status.textContent = description.status;

    const heading = document.createElement("h3");
    heading.textContent = description.title;

    container.append(status, heading);

    if (description.text) {
      const paragraph = document.createElement("p");
      paragraph.textContent = description.text;
      container.append(paragraph);
    }

    if (county.pairingSlug) {
      const link = document.createElement("a");
      link.className = "button button-light";
      link.href = `${root}pairings/${county.pairingSlug}/`;
      link.textContent = "Open the full profile";
      container.append(link);
    }
  }

  async function initialiseCountyAtlas() {
    const mapContainer = document.querySelector("[data-county-map]");
    const listContainer = document.querySelector("[data-county-list]");
    const resultContainer = document.querySelector("[data-county-result]");
    const search = document.querySelector("#county-search");
    const resultCount = document.querySelector("[data-result-count]");
    if (!mapContainer || !listContainer || !resultContainer || !search) return;

    try {
      const [mapResponse, countiesResponse] = await Promise.all([
        fetch(`${root}data/county-map.json`),
        fetch(`${root}data/counties.json`),
      ]);
      if (!mapResponse.ok || !countiesResponse.ok) {
        throw new Error("County data could not be loaded.");
      }
      const [mapData, countiesData] = await Promise.all([
        mapResponse.json(),
        countiesResponse.json(),
      ]);
      const geometryBySlug = new Map(
        mapData.counties.map((county) => [county.slug, county]),
      );
      const data = {
        ...mapData,
        counties: countiesData.counties.map((county) => ({
          ...geometryBySlug.get(county.slug),
          ...county,
        })),
      };

      const namespace = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(namespace, "svg");
      svg.setAttribute("viewBox", data.viewBox);
      svg.setAttribute("role", "group");
      svg.setAttribute("aria-labelledby", "county-map-title county-map-description");

      const title = document.createElementNS(namespace, "title");
      title.id = "county-map-title";
      title.textContent = "Interactive map of Ireland’s 26 counties";
      const description = document.createElementNS(namespace, "desc");
      description.id = "county-map-description";
      description.textContent =
        "Select a county to see whether its evidence-led profile is open.";
      const group = document.createElementNS(namespace, "g");
      const shapeBySlug = new Map();
      const buttonBySlug = new Map();
      let activeSlug = "";

      function selectCounty(county, updateHash = true) {
        activeSlug = county.slug;
        for (const [slug, shape] of shapeBySlug) {
          const isActive = slug === activeSlug;
          shape.classList.toggle("is-active", isActive);
          shape.setAttribute("aria-pressed", String(isActive));
        }
        for (const [slug, button] of buttonBySlug) {
          button.classList.toggle("is-active", slug === activeSlug);
        }
        renderCountyResult(resultContainer, county);
        if (updateHash) {
          history.replaceState(null, "", `#county-${county.slug}`);
        }
      }

      for (const county of data.counties) {
        const shape = document.createElementNS(namespace, "path");
        shape.classList.add("county-shape");
        shape.dataset.slug = county.slug;
        shape.dataset.profile = county.profileStatus;
        shape.setAttribute("d", county.mapPath);
        shape.setAttribute("tabindex", "0");
        shape.setAttribute("role", "button");
        shape.setAttribute("aria-pressed", "false");
        const state =
          county.profileStatus === "published-prototype"
            ? `verified pairing with ${county.officialUmbrellaPairing.partnerCountry}`
            : "profile not yet recorded";
        shape.setAttribute("aria-label", `${county.name}, ${state}`);
        shape.addEventListener("click", () => selectCounty(county));
        shape.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectCounty(county);
          }
        });
        group.append(shape);
        shapeBySlug.set(county.slug, shape);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "county-button";
        button.dataset.slug = county.slug;
        button.dataset.profile = county.profileStatus;
        const countyName = document.createElement("span");
        countyName.className = "county-button-name";
        countyName.textContent = county.name;
        const partnerCountry = document.createElement("span");
        partnerCountry.className = "county-button-country";
        partnerCountry.textContent = county.officialUmbrellaPairing.partnerCountry;
        button.append(countyName, partnerCountry);
        button.addEventListener("click", () => {
          selectCounty(county);
          shape.focus({ preventScroll: true });
        });
        listContainer.append(button);
        buttonBySlug.set(county.slug, button);
      }

      svg.append(title, description, group);
      mapContainer.replaceChildren(svg);
      mapContainer.setAttribute("aria-busy", "false");

      search.addEventListener("input", () => {
        const query = search.value.trim().toLocaleLowerCase("en-IE");
        let matches = 0;
        for (const county of data.counties) {
          const match =
            county.name.toLocaleLowerCase("en-IE").includes(query) ||
            county.irishName.toLocaleLowerCase("ga-IE").includes(query);
          buttonBySlug.get(county.slug).hidden = !match;
          shapeBySlug
            .get(county.slug)
            .classList.toggle("is-filtered-out", !match);
          if (match) matches += 1;
        }
        if (resultCount) resultCount.textContent = String(matches);
        if (matches === 1) {
          const county = data.counties.find(
            (item) => !buttonBySlug.get(item.slug).hidden,
          );
          selectCounty(county, false);
        }
      });

      const initialSlug = window.location.hash.startsWith("#county-")
        ? window.location.hash.replace("#county-", "")
        : "";
      const initialCounty = data.counties.find(
        (county) => county.slug === initialSlug,
      );
      if (initialCounty) selectCounty(initialCounty, false);
    } catch (error) {
      mapContainer.setAttribute("aria-busy", "false");
      const message = document.createElement("p");
      message.className = "map-error";
      message.textContent =
        "The interactive map could not load. The Cork–France profile and county directory remain available.";
      mapContainer.replaceChildren(message);
      console.error("County atlas failed to load:", error);
    }
  }

  function initialiseQuiz() {
    const form = document.querySelector("[data-quiz]");
    const result = document.querySelector("[data-quiz-result]");
    if (!form || !result) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const questions = [...form.querySelectorAll("[data-answer]")];
      const unanswered = questions.find(
        (question) => !question.querySelector("input:checked"),
      );
      if (unanswered) {
        result.textContent = "Choose one answer for each question first.";
        unanswered.querySelector("input")?.focus();
        return;
      }
      let score = 0;
      for (const question of questions) {
        const selected = question.querySelector("input:checked");
        if (selected.value === question.dataset.answer) score += 1;
      }
      result.textContent =
        score === questions.length
          ? `${score} out of ${questions.length}. Excellent—you kept verified facts separate from research leads.`
          : `${score} out of ${questions.length}. Recheck the status labels and evidence boundaries above.`;
      result.focus();
    });
  }

  function buildContributionText(form) {
    const data = new FormData(form);
    const value = (name) => (data.get(name) || "").toString().trim();
    return [
      "EUROPA COUNTY PAIRING RESEARCH CONTRIBUTION",
      "",
      `Contributor display name: ${value("displayName") || "Not provided"}`,
      `Contact email: ${value("email") || "Not provided"}`,
      `Irish county: ${value("county")}`,
      `Proposed overseas locality: ${value("locality") || "Not yet proposed"}`,
      `Contribution type: ${value("contributionType")}`,
      "",
      "CLAIM OR RESEARCH QUESTION",
      value("summary"),
      "",
      "SIMILARITY TO INVESTIGATE",
      value("similarity") || "Not provided",
      "",
      "DIFFERENCE TO INVESTIGATE",
      value("difference") || "Not provided",
      "",
      "STUDENT OR COMMUNITY PERSPECTIVE",
      value("perspective") || "Not provided",
      "",
      "SOURCE 1",
      value("sourceOne"),
      "",
      "SOURCE 2",
      value("sourceTwo") || "Not provided",
      "",
      "SOURCE NOTES / WHAT EACH SOURCE SUPPORTS",
      value("sourceNotes"),
      "",
      "PERMISSIONS",
      value("permissions") ? "Editorial and consent requirements acknowledged." : "",
      `Name publication preference: ${value("namePermission")}`,
      "",
      "This is a research submission, not verified website content. It requires editorial review before publication.",
    ].join("\n");
  }

  function initialiseContributionForm() {
    const form = document.querySelector("[data-contribution-form]");
    const copyButton = document.querySelector("[data-copy-contribution]");
    if (!form) return;

    const prepare = async (openEmail) => {
      if (!form.reportValidity()) return;
      const text = buildContributionText(form);
      if (!openEmail) {
        await copyText(text);
        showToast("Research brief copied.");
        return;
      }
      const subject = `County Pairing Research Contribution — ${
        new FormData(form).get("county") || "New submission"
      }`;
      window.location.href = `mailto:europasociety@ucc.ie?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(text)}`;
      showToast("Your email app should open with the brief ready to review.");
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      prepare(true);
    });
    copyButton?.addEventListener("click", () => prepare(false));
  }

  initialiseSharing();
  initialiseCountyAtlas();
  initialiseQuiz();
  initialiseContributionForm();
})();
