import { cheerio } from "https://deno.land/x/cheerio@1.0.4/mod.ts";
import { CsvFile } from "https://deno.land/x/csv_file/mod.ts";

// TODO: Edit here
// const initial_url = 'https://devdojo.com/';
// const base_url = 'devdojo.com';
// const initial_url = 'https://www.msu.ru/en/';
// const base_url = 'msu.ru';
const initial_url = 'https://www.aims.gov.au/';
const base_url = 'aims.gov.au';

let all_links = new Set();
let emails_csv = new CsvFile(await Deno.open('./projects/data/emails.csv', {read: true, write: true, create: true, truncate: true}));

/*
targets:
  email
  linkedin
  youtube
  facebook
  instagram
  twitter
  discord
*/

let emails = new Set();

async function crawl(url) {
  if (!url.includes(base_url)) {
    return;
  }
  if (all_links.has(url)) {
    return;
  }
  all_links.add(url);
  // console.log(url);
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html)  

    const links = $('a');
    const links_length = links.length;
    for (let i = 0; i < links_length; i++) {
        let urlRegEx = RegExp(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm);
        // console.log(cheerio.text($('title').parent()));
        // console.log($('#main-content').parent().text());
        // console.log(cheerio.html($('a').get("7").parent.parent));
        
        if (!urlRegEx.test(links[i].attribs.href)) {
          if (links[i].attribs.href?.includes('mailto:')) {
            const email = links[i].attribs.href.replace('mailto:', '');
            if (!emails.has(email)) {
              console.log(email);
              // let text_near_email = cheerio.text($('a').get(i.toString()).parent.parent);
              let text_near_email = cheerio.text($('a').get(i).parent.parent.children);
              await emails_csv.writeRecord([email]);
            }
            emails.add(email);
            continue;
          }
          let full_link = initial_url + (links[i].attribs.href)?.replace(/^\/+/, '');
          crawl(full_link);
        } else {
          crawl(links[i].attribs.href);
        }
      }

  } catch(error) {
    console.log(error);
  }
}

await crawl(initial_url);
emails_csv.close();
