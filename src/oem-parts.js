const shopifyTreeEndPoint = "https://api-server.com";
let oemPartsWidgetQueryTail = "";

function UrlParseTailOemPartsWidget() {
  const url = new URL(window.location);
  url.searchParams.delete("brand");
  url.searchParams.delete("year");
  return url.searchParams.toString();
}

function initOemPartsWidget() {
  const searchParams = new URLSearchParams(window.location.search);
  const brand = searchParams.get("brand");
  const year = searchParams.get("year");
  oemPartsWidgetQueryTail = UrlParseTailOemPartsWidget();
  buildHeaderOemPartsWidget(brand);
  buildHeaderArticle();
  buildFooterOemPartsWidget();
  if (brand && year) {
    buildHeaderArticle(`Select the model for your ${year} ${brand}`);
    new BrandCollectionsOemPartsWidget(brand, year);
    return;
  }
  if (brand && !year) {
    buildHeaderArticle(`Select the Year for your ${brand}`);
    new BrandYearsPadOemPartsWidget(brand);
    return;
  }
  new BrandsPadOemPartsWidget();
}

function buildHeaderOemPartsWidget(brand) {
  if (pageSettings === null || pageSettings === undefined) {
    return;
  }
  const header = document.getElementById("oemparts-widget-title");
  const headerBgLink = pageSettings["title_background_image"] || "";
  const headerContainer = document.getElementById("oemparts-widget-title-container");
  headerContainer.style.backgroundImage = `url(${headerBgLink})`;
  const headerText = document.getElementById("oemparts-widget-title-h1");
  headerText.innerText = pageSettings["title"] || "";
  headerText.style.fontSize = pageSettings["title_font_size"] || 40 + "px";
  if (brand !== null) {
    const textColorKey = "title_color_" + brand.toLowerCase().replaceAll(/\s+/g, "-");
    headerText.style.color = pageSettings[textColorKey] || "initial";
  } else {
    headerText.style.color = pageSettings["title_font_color"] || "#000000";
  }
  headerText.style.textAlign = pageSettings["title_text_align"] || "center";
  let brandImgKey = "";
  if (brand !== null) {
    const logImg = document.createElement("img");
    logImg.id = "oemparts-widget-title-image";
    header.appendChild(logImg);
    brandImgKey = "brand_logo_url_header_" + brand.toLowerCase().replaceAll(/\s+/g, "-");
    if (pageSettings[brandImgKey] !== undefined) {
      logImg.src = pageSettings[brandImgKey] || "";
      logImg.alt = brand;
      if (window.innerWidth > 768) {
        logImg.style.height = `${headerText.offsetHeight}px`;
      }
      logImg.style.width = `auto`;
    }
  } else {
    headerText.style.width = "100%";
  }
}

function buildFooterOemPartsWidget() {
  if (pageSettings === null || pageSettings === undefined) {
    return;
  }
  const footer = document.getElementById("oemparts-widget-footer");
  footer.innerHTML = pageSettings["footer"] || "";
}

class BrandsPadOemPartsWidget {
  brands = [];

  constructor() {
    this.getBrands().then((data) => this.brandsBuild(data));
  }

  async buildBrandMap(brands) {
    let brandMap = new Map();
    brands.forEach((brand) => {
      let brandKey = brand.replaceAll(/[\s-_]+/g, "").toLowerCase();
      brandMap.set(brandKey, brand);
    });
    return brandMap;
  }

  async brandsBuild(data) {
    try {
      if ("Response" in data) {
        const brandMap = await this.buildBrandMap(data.Response);
        if (pageSettings["brand_order"] === undefined) {
          this.brands = data.Response;
        } else {
          let keys = pageSettings["brand_order"].split(",");
          keys.forEach((key) => {
            let b = brandMap.get(key.replaceAll(/[\s-_'"]+/g, "").toLowerCase());
            if (b !== undefined) {
              this.brands.push(brandMap.get(key.replaceAll(/[\s-_'"]+/g, "").toLowerCase()));
            }
          });
        }
      }
      const widget = document.getElementById("brandspad");
      buildBreadCrumbsOemPartsWidget();
      const brandsContainer = document.createElement("section");
      brandsContainer.id = "brands-container";
      this.brands.forEach((brand) => {
        let brandItem = document.createElement("div");
        brandItem.className = "brand-item";
        let brandImgKey = "brand_logo_url_bg_" + brand.toLowerCase().replaceAll(/\s+/g, "-");
        if (pageSettings[brandImgKey] !== undefined) {
          brandItem.style.backgroundImage = `url(${pageSettings[brandImgKey]})`;
        }
        const itemTitle = document.createElement("h2");
        itemTitle.className = "brand-item__title";
        itemTitle.classList.add("hidden");
        itemTitle.innerText = brand;
        brandItem.appendChild(itemTitle);
        const itemId = "itemlink-" + brand.replaceAll(/\s+/g, "_");
        const brandLink = document.createElement("a");
        brandLink.href = `?brand=${brand}`;
        if (oemPartsWidgetQueryTail.length > 0) {
          brandLink.href += `&${oemPartsWidgetQueryTail}`;
        }
        brandLink.id = itemId;
        brandLink.classList.add("brand-item-link");
        const brandImg = document.createElement("img");
        let logoUrlKey = "brand_logo_url_" + brand.toLowerCase().replaceAll(/\s+/g, "-");
        brandImg.src = pageSettings[logoUrlKey] || "";
        brandImg.alt = brand;
        brandImg.classList.add("brand-item-img");
        brandImg.onerror = () => {
          brandImg.classList.add("hidden");
          brandLink.innerHTML = `<h2>${brand}</h2>`;
        };
        brandLink.appendChild(brandImg);
        brandLink.addEventListener("mouseover", () => {
          brandLink.style.backgroundColor = pageSettings["hover_color"] || "#00000000";
        });
        brandLink.addEventListener("mouseleave", () => {
          brandLink.style.removeProperty("background-color");
        });
        brandItem.appendChild(brandLink);
        brandsContainer.appendChild(brandItem);
      });
      widget.appendChild(brandsContainer);
      widget.classList.remove("hidden");
    } catch (error) {
      console.log("Error fetching brands: ", error);
    }
  }

  async getBrands() {
    const url = shopifyTreeEndPoint + "/brand/";
    return fetch(url)
      .then((response) => {
        return response.json();
      });
  }
} //class Brandspad

class BrandYearsPadOemPartsWidget {
  years = [];
  brand = "";

  constructor(brand) {
    this.brand = brand;
    this.getYearOffBrand(this.brand).then((r) => {
      this.years = r["Response"] ?? [];
      this.buildYearsForBrand().then(() => {
      });
    });
  }

  getYearOffBrand(brand) {
    const url = shopifyTreeEndPoint + "/year/?brand=" + brand;
    return fetch(url)
      .then((response) => {
        return response.json();
      });
  }

  async buildYearsForBrand() {
    try {
      setHeaderBg(this.brand);
      buildBreadCrumbsOemPartsWidget(this.brand);
      const widget = document.getElementById("brandspad");
      const yearRow = document.createElement("div");
      yearRow.id = "year-row";
      this.years.forEach((year) => {
        const yearDiv = document.createElement("div");
        yearDiv.classList.add("year-link-box");
        const yLink = document.createElement("a");
        yLink.classList.add("year-link");
        yLink.href = `?brand=${this.brand}&year=${year}`;
        if (oemPartsWidgetQueryTail.length > 0) {
          yLink.href += `&${oemPartsWidgetQueryTail}`;
        }
        yLink.innerText = year;
        const bgColorOption = "title_bg_" + this.brand.toLowerCase().replaceAll(/\s+/g, "-");
        yLink.addEventListener("mouseover", () => {
          yLink.style.backgroundColor = pageSettings[bgColorOption] || "#ff7801";
          if (contrastColor(yLink.style.backgroundColor) <= 384) {
            yLink.style.color = "rgb(255,255,255)";
          } else {
            yLink.style.color = "rgb(0,0,0)";
          }
        });
        yLink.addEventListener("mouseleave", () => {
          yLink.style.removeProperty("background-color");
          yLink.style.removeProperty("color");
        });
        yearDiv.appendChild(yLink);
        yearRow.appendChild(yearDiv);
      });
      widget.appendChild(yearRow);
      widget.classList.remove("hidden");
    } catch (error) {
      console.log(`Error get years for ${this.brand}: `, error);
    }
  }
} //class BrandYearsPad

class BrandCollectionsOemPartsWidget {
  brand = "";
  year = "";
  data = [];

  constructor(brand, year) {
    this.brand = brand;
    this.year = year;
    this.data = [];
    const container = document.getElementById("equipments");
    buildBreadCrumbsOemPartsWidget(this.brand, this.year);
    const colContainer = document.createElement("section");
    colContainer.id = "collections-container";
    container.appendChild(colContainer);
    this.getEquips(this.brand, this.year).then((r) => {
      this.data = r["Response"] ?? [];
      this.buildCollections();
      this.show();
    });
    const backLink = document.getElementById("back-nav-link");
    if (backLink !== null && backLink !== undefined) {
      if (oemPartsWidgetQueryTail > 0) {
        backLink.href += `?${oemPartsWidgetQueryTail}`;
      }
    }
  }

  show() {
    const m = document.getElementById("equipments");
    m.classList.remove("hidden");
  }

  async getEquips(brand, year) {
    const url = shopifyTreeEndPoint + `/equipmenttype/ext?brand=${brand}&year=${year}`;
    return fetch(url)
      .then((response) => {
        return response.json();
      });
  }

  toID(str) {
    return str.replaceAll(" ", "-").toLowerCase();
  }

  buildCollections() {
    setHeaderBg(this.brand);
    const container = document.getElementById("collections-container");
    for (const brandName in this.data) {
      const models = this.data[brandName];
      const row = document.createElement("div");
      row.className = "accordion";
      const col = document.createElement("button");
      col.className = "accordion-button";
      const title = document.createElement("h2");
      title.id = this.toID(brandName);
      title.className = "brand-title-accordion";
      title.innerHTML = brandName;
      col.appendChild(title);
      row.appendChild(col);
      const modRow = document.createElement("div");
      modRow.className = "models-panel";
      modRow.classList.add("collection-col-row");
      if (window.innerWidth <= 768) {
        modRow.classList.add("collapsed");
      }
      models.forEach(model => {
        const collection = document.createElement("div");
        collection.className = "collection-col-model";
        let collection_link = `https://shopify shop/collections/${model["Handle"]}`;
        if (oemPartsWidgetQueryTail.length > 0) {
          collection_link += `?${oemPartsWidgetQueryTail}`;
        }
        const cLink = document.createElement("a");
        cLink.dataset.make = this.brand;
        cLink.dataset.year = this.year;
        cLink.dataset.equipmenttype = brandName;
        cLink.dataset.model = model["Handle"];
        cLink.href = collection_link;
        cLink.classList.add("model-item-link");
        cLink.target = "_self";
        cLink.innerHTML = `${model["Model"]}`;
        cLink.addEventListener("click", (ev) => {
          this.saveToStorage(ev);
        });
        collection.appendChild(cLink);
        modRow.appendChild(collection);
        row.appendChild(modRow);
      });
      container.appendChild(row);
    }
    if (window.innerWidth <= 768) {
      this.buildAccordion();
    }
  }

  buildAccordion() {
    //get all accordion elements
    const accordions = document.querySelectorAll(".accordion");
    // for each accordion element set event listener
    for (let i = 0; i < accordions.length; i++) {
      let accordion = accordions[i];
      //get all buttons
      let button = accordion.querySelector(".accordion-button");
      // set panel event listener onclick
      button.addEventListener("click", function() {
        button.classList.toggle("active");
        for (let p = 0; p < accordions.length; p++) {
          if (p !== i) {
            let btn = accordions[p].querySelector(".accordion-button");
            if (btn.classList.contains("active")) {
              btn.classList.remove("active");
            }
            let panel = accordions[p].querySelector(".models-panel");
            if (!panel.classList.contains("collapsed")) {
              panel.classList.add("collapsed");
            }
          }
        }
        let curPanel = accordion.querySelector(".models-panel");
        curPanel.classList.toggle("collapsed");
      });
    }
  }

  saveToStorage(ev) {
    const fitment = {
      "year": ev.target.dataset.year,
      "make": ev.target.dataset.make,
      "equipmenttype": ev.target.dataset.equipmenttype,
      "model": ev.target.dataset.model
    };
    localStorage.setItem("FitmentSet", JSON.stringify(fitment));
  }
} //class BrandCollections

function buildBreadCrumbsOemPartsWidget(make = null, year = null) {
  const navContainer = document.getElementById("breadcrumbs-nav");
  if (navContainer == null) {
    console.log("Breadcrumbs container not found");
    return;
  }
  const breadcrumb = document.createElement("ol");
  breadcrumb.classList.add("breadcrumb__list");
  breadcrumb.setAttribute("role", "list");
  const homeList = document.createElement("li");
  homeList.classList.add("breadcrumb__item");
  const homeListLink = document.createElement("a");
  homeListLink.classList.add("breadcrumb__link");
  homeListLink.classList.add("link");
  homeListLink.href = "/";
  if (oemPartsWidgetQueryTail.length > 0) {
    homeListLink.href += `?${oemPartsWidgetQueryTail}`;
  }
  homeListLink.innerText = "Home";
  homeList.appendChild(homeListLink);
  breadcrumb.appendChild(homeList);
  const oemList = document.createElement("li");
  oemList.classList.add("breadcrumb__item");
  const oemListLink = document.createElement("a");
  oemListLink.classList.add("breadcrumb__link");
  oemListLink.classList.add("link");
  oemListLink.href = window.location.origin + window.location.pathname;
  if (make == null) {
    oemListLink.classList.add("inactive-link");
  }
  oemListLink.innerText = "OEM Parts";
  if (oemPartsWidgetQueryTail.length > 0) {
    oemListLink.href += `?${oemPartsWidgetQueryTail}`;
  }
  oemList.appendChild(oemListLink);
  breadcrumb.appendChild(oemList);
  if (make != null) {
    const makeList = document.createElement("li");
    makeList.classList.add("breadcrumb__item");
    const makeListLink = document.createElement("a");
    makeListLink.classList.add("breadcrumb__link");
    makeListLink.classList.add("link");
    makeListLink.href = window.location.origin + window.location.pathname;
    makeListLink.href += `?brand=${make}`;
    makeListLink.innerText = make;
    if (oemPartsWidgetQueryTail.length > 0) {
      makeListLink.href += `&${oemPartsWidgetQueryTail}`;
    }
    if (year == null) {
      makeListLink.classList.add("inactive-link");
    }
    makeList.appendChild(makeListLink);
    breadcrumb.appendChild(makeList);
  }
  if (year != null) {
    const yearList = document.createElement("li");
    yearList.classList.add("breadcrumb__item");
    const yearListLink = document.createElement("a");
    yearListLink.classList.add("breadcrumb__link");
    yearListLink.classList.add("link");
    yearListLink.href = window.location.origin + window.location.pathname;
    yearListLink.href += `?brand=${make}&year=${year}`;
    yearListLink.innerText = year;
    if (oemPartsWidgetQueryTail.length > 0) {
      yearListLink.href += `?${oemPartsWidgetQueryTail}`;
    }
    yearListLink.classList.add("inactive-link");
    yearList.appendChild(yearListLink);
    breadcrumb.appendChild(yearList);
  }
  navContainer.appendChild(breadcrumb);
}

function setHeaderBg(brand) {
  const headerContainer = document.getElementById("oemparts-widget-title-container");
  const header = document.getElementById("oemparts-widget-title");
  const bgColorOption = "title_bg_" + brand.toLowerCase().replaceAll(/\s+/g, "-");
  if (pageSettings[bgColorOption] !== undefined) {
    headerContainer.style.backgroundImage = "";
    header.style.backgroundColor = pageSettings[bgColorOption];
    headerContainer.style.backgroundColor = pageSettings[bgColorOption];
  }
}

function buildHeaderArticle(content) {
  if (content === undefined) {
    content = "";
  }
  const header = document.getElementById("oemparts-widget-header");
  header.innerHTML = pageSettings["header"] || content;
}

function contrastColor(rgbColorString) {
  const matchedColor = rgbToArray(rgbColorString);
  if (matchedColor === null) {
    return null;
  }
  return matchedColor.reduce((a, b) => a + b, 0);
}

function rgbToArray(rgbStr) {
  if (rgbStr === null) {
    return null;
  }
  const matched = rgbStr.match(/\d+/g);
  if (matched) {
    return matched.map(Number);
  }
  return null;
}

/**
 * entry point - the widget is initialized on DomContentLoaded event
 */
window.addEventListener("DOMContentLoaded", () => {
  initOemPartsWidget();
});
