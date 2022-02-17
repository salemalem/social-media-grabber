import { cheerio } from "https://deno.land/x/cheerio@1.0.4/mod.ts";

const base_url = 'https://80.lv/articles';

let all_links = new Set();

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

const socialMediaRegex = {
  linkedIn: new RegExp(/^(http(s)?:\/\/)?([\w]+\.)?linkedin\.com\/(pub|in|profile)/gm),
  youtube: new RegExp(/^(http(s)?:\/\/)?(www\.)?youtube\.com/gm),
  facebook: new RegExp(/^(http(s)?:\/\/)?(www\.)?facebook\.com/gm),
  instagram: new RegExp(/^(http(s)?:\/\/)?(www\.)?instagram\.com/gm),
  twitter: new RegExp(/^(http(s)?:\/\/)?(www\.)?twitter\.com/gm),
  discord: new RegExp(/^(http(s)?:\/\/)?(www\.)?discord\.gg/gm),
}

let socialMediaLinks = new Set();

async function crawl(url) {
  if (all_links.has(url)) {
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
      for (let regex in socialMediaRegex) {
        if (socialMediaRegex[regex].test(links[i].attribs.href)) {
          socialMediaLinks.add(links[i].attribs.href);
        }
      }
    }

  } catch(error) {
    console.log(error);
  }
}

await crawl(base_url);
console.log(socialMediaLinks);