import { cheerio } from "https://deno.land/x/cheerio@1.0.4/mod.ts";
import { FileDB } from "https://deno.land/x/filedb/mod.ts";

const db = new FileDB({ rootDir: "./data", isAutosave: true }); // create database with autosave

const socialMediaLinksDB = await db.getCollection("socialMediaLinks");
const emailsDB = await db.getCollection("emails");
const telPhoneNumbersDB = await db.getCollection("telPhoneNumbers");

// TODO: Edit here
const initial_url = 'https://devdojo.com/';
const base_url = 'devdojo.com';

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
  reddit: new RegExp(/^(http(s)?:\/\/)?(www\.)?reddit\.com/gm),
}

let socialMediaLinks = new Set();
let emails = new Set();
let phoneNumbers = new Set();

async function crawl(url) {
  if (!url.includes(base_url)) {
    return;
  }
  if (all_links.has(url)) {
    return;
  }
  all_links.add(url);
  console.log(url);
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html)  

    const links = $('a');
    const links_length = links.length;
    for (let i = 0; i < links_length; i++) {
      let media = false;
      for (let regex in socialMediaRegex) {
        if (socialMediaRegex[regex].test(links[i].attribs.href)) {
          socialMediaLinks.add(links[i].attribs.href);
          await socialMediaLinksDB.insertOne(
            links[i].attribs.href
          );
          media = true;
          break;
        }
      }
      
      if (!media) {
        let urlRegEx = RegExp(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm);
        if (!urlRegEx.test(links[i].attribs.href)) {
          if (links[i].attribs.href.includes('mailto:')) {
            emails.add(links[i].attribs.href.replace('mailto:', ''));
            continue;
          } else if (links[i].attribs.href.includes('tel:')) {
            phoneNumbers.add(links[i].attribs.href.replace('tel:', ''));
            continue;
          }
          let full_link = initial_url + (links[i].attribs.href).replace(/^\/+/, '');
          crawl(full_link);
        } else {
          crawl(links[i].attribs.href);
        }
      }
    }

  } catch(error) {
    console.log(error);
  }
}

await crawl(initial_url);