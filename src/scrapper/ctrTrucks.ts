import puppeteer from "puppeteer";
import Truck from "../models/truck";
import { sendErrorEmail } from "../utils";

export default async function scrapCtrTrucks() {
  try {
    // Create browser
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      defaultViewport: { width: 1024, height: 1600 },
    });

    try {
      // Create page
      const page = await browser.newPage();

      try {
        // Go to the page
        await page.goto(
          "https://www.ctrtrucks.com.au/inventory/?/listings/for-sale/equipment/all?AccountCRMID=8048945&dlr=1&settingscrmid=8048945",
          { timeout: 0 }
        );

        try {
          // Get all urls in the page
          const truckUrls = await page.evaluate(() => {
            // Get all url nodes
            const urlNodes = document.querySelectorAll(
              "#listContainer > div > div > div > div.listing-content > div.listing-content-right > span > span > a"
            );

            // Return the full urls
            return Array.from(urlNodes).map(
              (urlNode) => urlNode.getAttribute("href") as string
            );
          });

          // All trucks
          let trucks: any[] = [];

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

                  // Get feature text
                  const getFeatureText = (identifier: string) => {
                    // Get key elements
                    const keyElements = Array.from(
                      document.querySelectorAll(
                        "#main-content > div.detail__specs > div:nth-child(2) > div.detail__specs-label"
                      )
                    );

                    // Get target key element
                    const targetElement = keyElements.find(
                      (element) => element.textContent === identifier
                    );

                    // Get value elements
                    const valueElements = Array.from(
                      document.querySelectorAll(
                        "#main-content > div.detail__specs > div:nth-child(2) > div.detail__specs-value"
                      )
                    );

                    // Return text content of the value element
                    if (targetElement) {
                      return valueElements
                        .find(
                          (element, index) =>
                            index === keyElements.indexOf(targetElement)
                        )
                        ?.textContent?.trim();
                    }
                  };

                  // Name
                  const name = getSelectorText(
                    "#main-content > div.detail__right-col > div.detail__details > div.detail__heading > div.detail__title-container > h1"
                  );

                  // Price
                  const price = getSelectorText(
                    "#main-content > div.detail__right-col > div.detail__details > div.listing-prices > div > div.listing-prices__retail > div > span"
                  )
                    ?.replace("AUD ", "")
                    .slice(1)
                    .replace(",", "");

                  // Year
                  const year = getFeatureText("Year");

                  // Make
                  const make = getFeatureText("Manufacturer");

                  // Model
                  const model = getFeatureText("Model");

                  // Get image nodes
                  const imageNodes = document.querySelectorAll(
                    "#mediaControl_0 > div.mc-thumbs.mc-thumbs-overflow > div.mc-thumb-strip > div.mc-thumb-slider > ul > li > div > img"
                  );

                  // Get all images
                  const images = Array.from(imageNodes).map(
                    (imageNode) =>
                      `https:${imageNode
                        .getAttribute("data-src")
                        ?.replace("&w=150", "&w=614")
                        .replace("&h=112", "&h=460")}`
                  );

                  // Return the truck object
                  return {
                    name,
                    price,
                    year,
                    make,
                    model,
                    images,
                    location: "VIC",
                    website: "ctrtrucks",
                  };
                });

                // Add truck to trucks
                trucks = [...trucks, { ...truck, origin: truckUrls[i] }];
              } catch (err) {
                // Send email
                console.log(err);
                // sendErrorEmail("CRT Trucks");
              }
            } catch (err) {
              // Send email
              console.log(err);
              // sendErrorEmail("CRT Trucks");
            }
          }

          if (trucks.length > 0) {
            // Replace the trucks in the db
            try {
              // Delete all previous trucks
              await Truck.deleteMany({ website: "ctrtrucks" });

              try {
                // Create new trucks
                await Truck.create(trucks);

                // Confirm message
                console.log(trucks.length, "CTR Trucks done");

                // Close the browser
                await browser.close();
              } catch (err) {
                // Close the browser and send email
                console.log(err);
                await browser.close();
                // sendErrorEmail("CRT Trucks");
              }
            } catch (err) {
              // Close the browser and send email
              console.log(err);
              await browser.close();
              // sendErrorEmail("CRT Trucks");
            }
          } else {
            // Log error and close browser
            console.log("Something went wrong");
            await browser.close();
          }
        } catch (err) {
          // Close the browser and send email
          console.log(err);
          await browser.close();
          // sendErrorEmail("CRT Trucks");
        }
      } catch (err) {
        // Close the browser and send email
        console.log(err);
        await browser.close();
        // sendErrorEmail("CRT Trucks");
      }
    } catch (err) {
      // Close the browser and send email
      console.log(err);
      await browser.close();
      // sendErrorEmail("CRT Trucks");
    }
  } catch (err) {
    console.log(err);
    // sendErrorEmail("CRT Trucks");
  }
}
