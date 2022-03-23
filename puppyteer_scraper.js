import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

const browser = await puppeteer.launch();
const page = await browser.newPage();

let urls = {
  initial_url: "https://www.irf.se/en/contact-kiruna/",
  base_domain: "irf.se",
}

async function crawl(urls) {

  await page.goto(urls["initial_url"], {
    waitUntil: "networkidle2",
  });
  // await page.screenshot({ path: "screenshot.png" });
  console.log("Started");
  let emails_with_text_and_nav_links = await page.evaluate(() => {
    let links = document.getElementsByTagName("a");
    let text_around = [];
    let emails = [];
    let nav_links = [];

    for (let i = 0; i < links.length; i++) {
      let link = links[i];
      let link_href = link.href;
      if (link.href.includes("mailto:")) {
        let email = link_href.split("mailto:")[1];
        emails.push(email);
        text_around.push(link.parentNode.parentNode.parentNode.textContent);
      } else {
        nav_links.push(link_href);
      }
    }
    return {
      emails,
      text_around,
      nav_links
    };
  });

  console.log(emails_with_text_and_nav_links);
}

await crawl(urls);
await browser.close();
