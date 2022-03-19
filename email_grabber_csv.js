import { cheerio } from "https://deno.land/x/cheerio@1.0.4/mod.ts";
import * as XLSX from 'https://deno.land/x/sheetjs/xlsx.mjs'
import * as cptable from 'https://deno.land/x/sheetjs/dist/cpexcel.full.mjs';
XLSX.set_cptable(cptable);

// TODO: Edit here
// const initial_url = 'https://www.msu.ru/en/';
// const base_url = 'msu.ru';
// const initial_url = 'https://www.ifw-kiel.de/';
// const base_url = 'ifw-kiel.de';
const initial_url = 'http://www.eie.gr/';
const base_url = 'eie.gr';

let all_links = new Set();

let workbook = XLSX.utils.book_new();
let contacts = [];

let emails = new Set();

// timer to stop functions
let startTime = Date.now();
let endTime = startTime + 150000;
// endTime = startTime + 5500;
async function crawl(url) {
  console.log(url);
  if (!url.includes(base_url)) {
    return;
  }
  if (all_links.has(url)) {
    return;
  }
  if (Date.now() >= endTime) {
    // console.log("time is up");
    return;
  }
  all_links.add(url);
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html)  

    const links = $('a');
    const links_length = links.length;
    for (let i = 0; i < links_length; i++) {
        // console.log(links[i].attribs.href);
        let mailToRegex = RegExp(/mailto:([^\?]*)/gm);
        if (mailToRegex.test(links[i].attribs.href)) {
          const email = links[i].attribs.href.replace('mailto:', '');
          if (!emails.has(email)) {
            console.log(email);
            let text_near_email = cheerio.text($('a').get(i).parent.parent.children);
            contacts.push({
              "email": email,
              "text_near": text_near_email,
            });
          }
          emails.add(email);
          continue;
        }
        let urlRegEx = RegExp(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm);
        if (!urlRegEx.test(links[i].attribs.href)) {
          let full_link = initial_url + (links[i].attribs.href)?.replace(/^\/+/, '');
          await crawl(full_link);
        } else {
          await crawl(links[i].attribs.href);
        }
      }

  } catch(error) {
    console.log(error);
  }
}

async function main() {
  await crawl(initial_url)
  console.log(contacts);
  try { await Deno.remove('./projects/data/emails.xlsx'); } catch (error) {}
  let ws = XLSX.utils.json_to_sheet(contacts);
  XLSX.utils.book_append_sheet(workbook, ws, "Contacts");
  XLSX.writeFile(workbook, './projects/data/emails.xlsx', {type: 'file'});
}

main();
