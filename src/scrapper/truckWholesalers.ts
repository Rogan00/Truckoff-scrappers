import puppeteer from "puppeteer";
import Truck from "../models/truck";
import { sendErrorEmail } from "../utils";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";

export default async function scrapTruckWholesalers() {
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
          "https://www.truckwholesalersaustralia.com.au/stock/search/",
          { timeout: 0 }
        );

        // Load all trucks
        async function loadAllTrucks() {
          try {
            // Scroll to page bottom
            //@ts-ignore
            await scrollPageToBottom(page);

            try {
              // Get the load more button
              const button = await page.$("#js-async-load-more-button");

              if (button) {
                try {
                  // Click on the button
                  await button.click();

                  // Call the function recursively
                  loadAllTrucks();
                } catch (err) {
                  // Close the browser and send email
                  console.log(err);
                  await browser.close();
                  // sendErrorEmail("Truck Wholesalers Australia");
                }
              } else {
                try {
                  // Get all the urls
                  const truckUrls = await page.evaluate(() => {
                    // Get all the nodes
                    const urlNodes = document.querySelectorAll(
                      "#js-sl-items-wrapper > div > div.sl-heading-link > a.sl-heading-details-link"
                    );

                    // Return the array of urls
                    return Array.from(urlNodes).map(
                      (urlNode) =>
                        `https://www.truckwholesalersaustralia.com.au${urlNode.getAttribute(
                          "href"
                        )}`
                    );
                  });

                  // All trucks
                  let trucks: any[] = [];

                  // Loop through the urls and extract the data
                  for (let i = 0; i < truckUrls.length; i++) {
                    try {
                      // Go to the truck page
                      await page.goto(truckUrls[i], { timeout: 0 });

                      try {
                        // Get truck details
                        const truck = await page.evaluate(() => {
                          // Get selector text
                          const getSelectorText = (selector: string) =>
                            document
                              .querySelector(selector)
                              ?.textContent?.trim();

                          // Get feature text
                          const getFeatureText = (identifier: string) =>
                            Array.from(
                              document.querySelectorAll(
                                "body > main > div > div.sd-col-g > div > div.sd-group1-wrapper.sd-specification > div.sd-specs-wrapper > div.sd-specs-items-wrapper > div.sd-specs-item"
                              )
                            )
                              .find(
                                (feature) =>
                                  feature.firstElementChild?.textContent ===
                                  identifier
                              )
                              ?.lastElementChild?.textContent?.trim();

                          // Name
                          const name = getSelectorText(
                            "body > main > div > div.sd-col-g > div > div.sl-heading-link > div.sl-heading-model-wrapper > h3"
                          );

                          // Price
                          const price = name?.includes("$")
                            ? name
                                .split("$")[1]
                                .split(" ")[0]
                                .replace("+GST", "")
                                .replace(",", "")
                            : "poa";

                          // Year
                          const year = getFeatureText("Year");

                          // Make
                          const make = name?.split(" ")[1];

                          // Kilometers
                          const kilometers = getFeatureText("Kilometres");

                          // GVM
                          const gvm = getFeatureText("GVM")?.replace(
                            "kg",
                            "KG"
                          );

                          // Body
                          const bodyType = getFeatureText("Body");

                          // Get image nodes
                          const imageNodes = document.querySelectorAll(
                            "#thumbnailSlider > div.owl-wrapper-outer > div > div > div > img"
                          );

                          // Get image urls
                          const images = Array.from(imageNodes).map(
                            (imageNode) =>
                              imageNode
                                .getAttribute("src")
                                ?.replace("/vehicles/small", "/vehicles/large")
                          );

                          // Return the truck object
                          return {
                            name,
                            price,
                            year,
                            gvm,
                            make,
                            images,
                            bodyType,
                            location: "VIC",
                            kilometers: kilometers
                              ? `${kilometers} KM`
                              : undefined,
                            website: "truckwholesalersaustralia",
                          };
                        });

                        // Add truck to trucks
                        trucks = [
                          ...trucks,
                          { ...truck, origin: truckUrls[i] },
                        ];
                      } catch (err) {
                        // Send email
                        console.log(err);
                        // sendErrorEmail("Truck Wholesalers Australia");
                      }
                    } catch (err) {
                      // Send email
                      console.log(err);
                      // sendErrorEmail("Truck Wholesalers Australia");
                    }
                  }

                  if (trucks.length > 0) {
                    // Replace the trucks in the db
                    try {
                      // Delete all previous trucks
                      await Truck.deleteMany({
                        website: "truckwholesalersaustralia",
                      });

                      try {
                        // Create new trucks
                        await Truck.create(trucks);

                        // Confirm message
                        console.log(
                          trucks.length,
                          "Truck Wholesalers Australia done"
                        );

                        // Close the browser
                        await browser.close();
                      } catch (err) {
                        // Close the browser and send email
                        console.log(err);
                        await browser.close();
                        // sendErrorEmail("Truck Wholesalers Australia");
                      }
                    } catch (err) {
                      // Close the browser and send email
                      console.log(err);
                      await browser.close();
                      // sendErrorEmail("Truck Wholesalers Australia");
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
                  // sendErrorEmail("Truck Wholesalers Australia");
                }
              }
            } catch (err) {
              // Close the browser and send email
              console.log(err);
              await browser.close();
              // sendErrorEmail("Truck Wholesalers Australia");
            }
          } catch (err) {
            // Close the browser and send email
            console.log(err);
            await browser.close();
            // sendErrorEmail("Truck Wholesalers Australia");
          }
        }

        // Run load all trucks function
        loadAllTrucks();
      } catch (err) {
        // Close the browser and send email
        console.log(err);
        await browser.close();
        // sendErrorEmail("Truck Wholesalers Australia");
      }
    } catch (err) {
      // Close the browser and send email
      console.log(err);
      await browser.close();
      // sendErrorEmail("Truck Wholesalers Australia");
    }
  } catch (err) {
    console.log(err);
    // sendErrorEmail("Truck Wholesalers Australia");
  }
}
