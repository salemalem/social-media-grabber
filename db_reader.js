import { FileDB } from "https://deno.land/x/filedb/mod.ts";

const db = new FileDB({ rootDir: "./data", isAutosave: true }); // create database with autosave
const emails = await db.getCollection("emails");

console.log(emails.findMany((element) => element.email))