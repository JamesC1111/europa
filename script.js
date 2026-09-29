"use strict";

(() => {
  const root = document.body.dataset.root || "";
  const toast = document.querySelector("[data-toast]");
  let toastTimer;
  const gaaCountyColours = Object.freeze({
    carlow: ["#177245", "#e4b62e"],
    cavan: ["#1f5fae", "#ffffff"],
    clare: ["#f1bd24", "#2362a8"],
    cork: ["#d92e28", "#ffffff"],
    donegal: ["#167043", "#e5bf24"],
    dublin: ["#65b8df", "#173d70"],
    galway: ["#791f3e", "#ffffff"],
    kerry: ["#177245", "#dfae24"],
    kildare: ["#ffffff", "#23734a"],
    kilkenny: ["#1f2020", "#e4b229"],
    laois: ["#1f5fae", "#ffffff"],
    leitrim: ["#1b7447", "#e8ba2c"],
    limerick: ["#247348", "#ffffff"],
    longford: ["#1f5fae", "#e2bd26"],
    louth: ["#d52c2d", "#ffffff"],
    mayo: ["#1a7449", "#d83234"],
    meath: ["#237444", "#e7b92b"],
    monaghan: ["#ffffff", "#225fa7"],
    offaly: ["#227247", "#e3b52a"],
    roscommon: ["#efd85a", "#2560a7"],
    sligo: ["#252525", "#ffffff"],
    tipperary: ["#2b67b1", "#e2b32a"],
    waterford: ["#ffffff", "#2563aa"],
    westmeath: ["#781f3f", "#ffffff"],
    wexford: ["#5f2a82", "#e2b52c"],
    wicklow: ["#2465af", "#e1b629"],
  });

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  function initialiseSharing() {
    for (const button of document.querySelectorAll("[data-share]")) {
      button.addEventListener("click", async () => {
        const shareData = {
          title: document.title,
          text: "Explore Europa Society at UCC's county pairings atlas.",
          url: window.location.href,
        };
        try {
          if (navigator.share) {
            await navigator.share(shareData);
            return;
          }
          await copyText(shareData.url);
          showToast("Link copied, ready to share.");
        } catch (error) {
          if (error?.name !== "AbortError") {
            showToast("Sharing was not available. You can copy the page address.");
          }
        }
      });
    }
  }

  async function initialiseCountyAtlas() {
    const mapContainer = document.querySelector("[data-county-map]");
    const listContainer = document.querySelector("[data-county-list]");
    const search = document.querySelector("#county-search");
    const resultCount = document.querySelector("[data-result-count]");
    if (!mapContainer || !listContainer || !search) return;

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
      const counties = countiesData.counties.map((county) => ({
        ...geometryBySlug.get(county.slug),
        ...county,
      }));
      const namespace = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(namespace, "svg");
      svg.setAttribute("viewBox", mapData.viewBox);
      svg.setAttribute("role", "group");
      svg.setAttribute("aria-labelledby", "county-map-title county-map-description");
      const title = document.createElementNS(namespace, "title");
      title.id = "county-map-title";
      title.textContent = "Interactive map of Ireland's 26 counties";
      const description = document.createElementNS(namespace, "desc");
      description.id = "county-map-description";
      description.textContent = "Select a county to open its county pairing profile.";
      const group = document.createElementNS(namespace, "g");
      const directoryLinkBySlug = new Map();
      const shapeBySlug = new Map();
      const profileUrl = (slug) => `${root}county/?county=${encodeURIComponent(slug)}`;

      for (const county of counties) {
        const shape = document.createElementNS(namespace, "path");
        shape.classList.add("county-shape");
        shape.dataset.slug = county.slug;
        const [primary, secondary] = gaaCountyColours[county.slug] || ["#d8e1dc", "#667c74"];
        shape.style.setProperty("--county-primary", primary);
        shape.style.setProperty("--county-secondary", secondary);
        shape.setAttribute("d", county.mapPath);
        shape.setAttribute("tabindex", "0");
        shape.setAttribute("role", "link");
        shape.setAttribute("aria-label", `${county.name}: open its profile with ${county.officialUmbrellaPairing.partnerCountry}`);
        const openProfile = () => {
          window.location.href = profileUrl(county.slug);
        };
        shape.addEventListener("click", openProfile);
        shape.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProfile();
          }
        });
        group.append(shape);
        shapeBySlug.set(county.slug, shape);

        const link = document.createElement("a");
        link.className = "county-button";
        link.dataset.slug = county.slug;
        link.href = profileUrl(county.slug);
        link.textContent = county.name;
        listContainer.append(link);
        directoryLinkBySlug.set(county.slug, link);
      }

      svg.append(title, description, group);
      mapContainer.replaceChildren(svg);
      mapContainer.setAttribute("aria-busy", "false");

      search.addEventListener("input", () => {
        const query = search.value.trim().toLocaleLowerCase("en-IE");
        let matches = 0;
        for (const county of counties) {
          const match = county.name.toLocaleLowerCase("en-IE").includes(query) || county.irishName.toLocaleLowerCase("ga-IE").includes(query);
          directoryLinkBySlug.get(county.slug).hidden = !match;
          shapeBySlug.get(county.slug).classList.toggle("is-filtered-out", !match);
          if (match) matches += 1;
        }
        if (resultCount) resultCount.textContent = String(matches);
      });
    } catch (error) {
      mapContainer.setAttribute("aria-busy", "false");
      const message = document.createElement("p");
      message.className = "map-error";
      message.textContent = "The interactive map could not load. The county directory remains available.";
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
      const unanswered = questions.find((question) => !question.querySelector("input:checked"));
      if (unanswered) {
        result.textContent = "Choose one answer for each question first.";
        unanswered.querySelector("input")?.focus();
        return;
      }
      const score = questions.reduce((total, question) => total + Number(question.querySelector("input:checked").value === question.dataset.answer), 0);
      result.textContent = `${score} out of ${questions.length}.`;
      result.focus();
    });
  }

  initialiseSharing();
  initialiseCountyAtlas();
  initialiseQuiz();
})();
