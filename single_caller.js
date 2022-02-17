async function crawl(url) {
    console.log(url);
    try {
      const res = await fetch(url);
      const html = await res.text();
    
      return crawl(url);  
    } catch(error) {
      console.log(error);
    }
}
await crawl('https://nu.edu.kz/');