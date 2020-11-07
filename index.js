const Mustache = require('mustache');
const config = require('./config.json')
const fs = require('fs');
const fetch = require('node-fetch');
const MUSTACHE_MAIN_DIR = './main.mustache';
process.on('unhandledRejection', (e) => { throw e});

let fields = {
   refresh_date: new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
      timeZone: 'Europe/Warsaw',
   }),
   total_projects: 0,
   total_issues: 0,
   total_pull_requests: 0,
}

async function getContributedProjects()
{
   console.log('Getting projects contributed list...')
   let lastResLength = 0, i = 0, result = [];
   do
   {
      let res = await fetch('https://api.github.com/search/issues?q=author:MrBartusek&per_page=100&page=' + (i + 1),
      { headers: { 'Authorization' : 'Basic ' + Buffer.from("MrBartusek" + ":" + process.env.GITHUB_PERSONAL_TOKEN).toString('base64') } })
      if(!res.ok)
      {
         res = await res.json();
         console.log(res);
         throw new Error('Contributed Projects API Error');
      }
      else
      {
         res = await res.json();
         console.log(`- Got page ${i+1} with ${res.items.length} results | Total search size: ${res.total_count}`)
         lastResLength = res.items.length;
         i++;
         for(const issue of res.items)
         {
            if(issue.author_association == "MEMBER") continue;
            const repositoryName = issue.repository_url.replace('https://api.github.com/repos/','');
            let index = result.findIndex(x => x.name == repositoryName);
            if(index == -1)
            {
               fields.total_projects++;
               index = result.push({ name: repositoryName, issues: 0, pull_requests: 0 }) - 1;
            }
            if(issue.draft != undefined)
            {  
               fields.total_pull_requests++;
               result[index].pull_requests++; 
            }
            else
            { 
               fields.total_issues++;
               result[index].issues++; 
            }
         }
      }
   } while(lastResLength == 100)
   result = result.sort((a,b) => (b.issues*0.25 + b.pull_requests)-(a.issues*0.25 + a.pull_requests));
   result = result.filter((x) => (x.issues *0.25 + x.pull_requests) > 1);
   result = result.slice(0,8);
   console.log(`- Done. Total projects: ${fields.total_projects} Total issues: ${fields.total_issues} Total PRs ${fields.total_pull_requests}`)
   return result;
}

async function main()
{
   console.log('Starting readme generation...')
   const contributedProjects = await getContributedProjects();
   fields = {...config, ...fields, open_source_contributions: contributedProjects}

   console.log('Generating template...')
   fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
      if (err) throw err;
      const output = Mustache.render(data.toString(), fields);
      fs.writeFileSync('README.md', output);
      console.log('Done!')
   });
}

main();
