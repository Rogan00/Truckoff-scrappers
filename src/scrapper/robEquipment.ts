import puppeteer from "puppeteer";

export default async function scrapRobEquipment() {
  try {
    // Create browser
    const browser = await puppeteer.launch({
      defaultViewport: { width: 1024, height: 1600 },
    });

    try {
      // Create page
      const page = await browser.newPage();

      // Truck URLs
      let truckUrls: string[] = [];

      // Get all truck urls from 3 pages
      for (let i = 1; i < 4; i++) {
        try {
          // Go to the page
          await page.goto(`https://rsef.com.au/stock/page/${i}/`, {
            timeout: 0,
          });

          try {
            // Get all urls in the page
            const truckUrlsPerPage = await page.evaluate(() => {
              // Get all url nodes
              const urlNodes = document.querySelectorAll(
                "#isotope-container > div > div > div > div.col-md-8 > div > a"
              );

              // Return the full urls
              return Array.from(urlNodes).map(
                (urlNode) => urlNode.getAttribute("href") as string
              );
            });

            // Add urls to truckUrls
            truckUrls = [...truckUrls, ...truckUrlsPerPage];
          } catch (err) {
            throw err;
          }
        } catch (err) {
          throw err;
        }
      }

      // Collect truck details
      for (let i = 0; i < truckUrls.length; i++) {
        try {
          // Go to truck page
          await page.goto(truckUrls[i], { timeout: 0 });

          try {
            // Create truck details
            const truck = await page.evaluate(() => {
              // Get selector text
              const getSelectorText = (selector: string) =>
                document.querySelector(selector)?.textContent?.trim();

              // Name
              const name = getSelectorText("div > header > h1");

              // Price
              const price = getSelectorText(
                "#content > div.container.single-car-page > div > div.col-md-4.fantasy-themes-sidebar-width.fantasy-themes-sidebar-car > div > div.widget.autoroyal-price-list > h2 > span"
              );

              // Year
              const year = getSelectorText("div > header > h1 > span");

              // Make
              const make = getSelectorText(
                "#content > div.container.single-car-page > div > div.col-md-4.fantasy-themes-sidebar-width.fantasy-themes-sidebar-car > div > div.widget.autoroyal-car-specifications > table > tbody > tr:nth-child(11) > td.value.h6"
              );

              // Kilometers
              const kilometers = getSelectorText(
                "#content > div.container.single-car-page > div > div.col-md-4.fantasy-themes-sidebar-width.fantasy-themes-sidebar-car > div > div.widget.autoroyal-car-specifications > table > tbody > tr:nth-child(1) > td.value.h6"
              )?.replace("km", "KM");

              // GVM
              const gvm = getSelectorText(
                "#content > div.container.single-car-page > div > div.col-md-4.fantasy-themes-sidebar-width.fantasy-themes-sidebar-car > div > div.widget.autoroyal-car-specifications > table > tbody > tr:nth-child(13) > td.value.h6"
              );

              // Get image nodes
              const imageNodes = document.querySelectorAll(
                "#cd-item-slider > ol > li"
              );

              // Get all images
              const images = Array.from(imageNodes).map((imageNode) =>
                imageNode.getAttribute("data-bg")
              );

              // Return the truck object
              return {
                name,
                price,
                year,
                make,
                gvm,
                images,
                kilometers,
                location: "SA",
              };
            });

            console.log(truck);
          } catch (err) {
            throw err;
          }
        } catch (err) {
          throw err;
        }
      }
    } catch (err) {
      throw err;
    }
  } catch (err) {
    throw err;
  }
}