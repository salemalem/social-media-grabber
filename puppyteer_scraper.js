import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

import * as XLSX from 'https://deno.land/x/sheetjs/xlsx.mjs'
import * as cptable from 'https://deno.land/x/sheetjs/dist/cpexcel.full.mjs';
XLSX.set_cptable(cptable);
let workbook = XLSX.utils.book_new();
try { await Deno.remove('./projects/data/emails.xlsx'); } catch (error) {}

const browser = await puppeteer.launch({
  headless: false,
});
const page = await browser.newPage();
await page.setDefaultNavigationTimeout(0); 

let urls_initial = {
  initial_url: "http://www.eie.gr/index-en.html",
  base_domain: "eie.gr",
}

let visited_links = new Set();
let sheet_id = 0;
let emails_global = new Set();

async function crawl(urls) {

  await page.goto(urls["initial_url"], {
    // waitUntil: "networkidle2",
    timeout: 0,
  });
  // await page.screenshot({ path: "screenshot.png" });
  console.log("Started");
  let emails_with_text_and_nav_links = await page.evaluate(() => {
    let links = document.getElementsByTagName("a");
    let texts_around = [];
    let emails = [];
    let nav_links = [];

    for (let i = 0; i < links.length; i++) {
      let link = links[i];
      let link_href = link.href;
      if (link.href.includes("mailto:")) {
        let email = link_href.split("mailto:")[1];
        emails.push(email);
        let text_around = link.parentNode.parentNode.textContent;
        text_around = text_around.replace(/[^a-zA-Z ]/g, ""); 
        texts_around.push(text_around);
      } else {
        nav_links.push(link_href);
      }
    }
    return {
      emails,
      texts_around,
      nav_links
    };
  });

  // saving to excel
  let emails_with_text = [];
  let emails_to_check_for_emptiness = [];
  for (let i = 0; i < emails_with_text_and_nav_links["emails"].length; i++) {
    if (!emails_global.has(emails_with_text_and_nav_links["emails"][i])) {
      emails_with_text.push({
        email:       emails_with_text_and_nav_links["emails"][i],
        text_around: emails_with_text_and_nav_links["texts_around"][i],
      });
      emails_to_check_for_emptiness.push(emails_with_text_and_nav_links["emails"][i]);
      emails_global.add(emails_with_text_and_nav_links["emails"][i]);
    }
  }
  if (emails_to_check_for_emptiness.length > 0) {
    console.log(emails_to_check_for_emptiness);
    let ws = XLSX.utils.json_to_sheet(emails_with_text);
    let sheet_name = "Contacts_" + sheet_id;
    XLSX.utils.book_append_sheet(workbook, ws, sheet_name);
    
    XLSX.writeFile(workbook, "./projects/data/emails.xlsx", {type: 'file'});
  }
  sheet_id += 1;
  // recursive crawls
  for (const link of emails_with_text_and_nav_links["nav_links"]) {
    console.log(link);
    if (!visited_links.has(link) && link.includes(urls["base_domain"])) {
      visited_links.add(link);

      await crawl({
        initial_url: link,
        base_domain: urls["base_domain"],
      });
    }
  }
}



await crawl(urls_initial);
await browser.close();
