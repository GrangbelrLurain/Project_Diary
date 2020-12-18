
const http = require('http');
const fs = require('fs');
const qs = require('querystring');
const url = require('url');

const template = function(css, data, list, urlSearchPath){
  return`
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>김규연의 일기장입니다.</title>
    <style>${css}</style>
  </head>
  <body>
    <header id="header">
      <h1><a href="/">logs from KKY</a></h1>
      <nav class="nav">
        <span class="list active"><a href="#">List</a></span>
        <span class="newlog active"><a href="/?newlog">Newlog</a></span>
      </nav>
    </header>
    <main id="view">
    ${data}
      <aside class="aside active">
      ${list}
      </aside>
    </main>
    <script>
      {
        const listBtn = document.querySelector(".nav .list")
        const aside = document.querySelector("#view .aside")
        listBtn.addEventListener("click", (event) => {
          event.preventDefault();
      
          listBtn.classList.toggle("active");
          aside.classList.toggle("active");
        })

        const navList = document.querySelectorAll(".aside ul li")
        navList.forEach((elem) => {
          const elemText = elem.querySelector("a").innerHTML;
          console.log(elem);
          if('${urlLint(urlSearchPath)}' == elemText){
            elem.classList.add("active");
          }
        })
      }
    </script>
  </body>
  </html>
`}


const main = function(date){
  return`
  <article class="inputArea">
    <h2 class="title">Hello, this is log from KKY</h2>
    <div class="date">now time is ${date}</div>
    <div class="btnWrap">
      <a href="/?newlog" class="btn">newlog</a>
    </div>
  </article>
  `
}

const listAdd = function(directory){
  let dirList = "<ul>";
  let i = 0;
  for(i=0; i<directory.length; i++){
    dirList += '<li><a href="/?path=';
    dirList += directory[i];
    dirList += '">';
    dirList += directory[i];
    dirList += '</a></li>';
  }
  dirList += "</ul>";
  return dirList;
}

const readNote = function(file, url){
  const startTitle = file.indexOf('title:');
  const startText = file.indexOf('text:');
  const startDate = file.indexOf('date:');
  const title = file.substring(startTitle+6, startText);
  const text = file.substring(startText+5, startDate);
  const date = file.substring(startDate+5);
  return `
  <article class="inputArea">
    <h2 class="title">${title}</h2>
    <div class="date">${date}</div>
    <div class="text">${text}</div>
    <div class="btnWrap">
      <a href="/change?path=${urlLint(url)}" class="btn">change</a>
      <form action="/delete" method="post">
        <input type="hidden" name="path" value="${url}"></input>
        <input type="submit" value="Delete" class="btn"></input>
      </form>
    </div>
  </article>
  `
}


const urlLint = function(url){
  const returnUrl = String(url).replace(/%20/gi,' '); 
  return returnUrl;
}

const server = http.createServer((req, res) => {
  const reqUrl = req.url;
  const urlQuery = url.parse(reqUrl, false).query;
  const urlPath = url.parse(reqUrl, true).pathname;
  const urlSearch = url.parse(reqUrl,'UTF-8',false).search;
  const urlSelect = [String(urlSearch).indexOf('?'), String(urlSearch).indexOf('=')];
  const urlSearchType = String(urlSearch).substring(urlSelect[0]-1,urlSelect[1]+1);
  const urlSearchPath = String(urlSearch).replace(urlSearchType,'');
  const date = new Date(Date.now());

  if(urlPath === '/favicon.ico'){
    res.writeHead(200, {'content-Type': 'image/x-icon'});
    return res.end();
  }
  if(urlPath === '/'){
    fs.readFile('assets/css/main.css','UTF-8',(err, css) => {
      if(err) throw err
      fs.readdir(`./assets/data`, (err, directory) => {
        if(err) throw err;
          if(urlQuery === 'newlog'){
            const newLog = function(){
              return`
              <article class="inputArea">
              <form action="/save?path=${urlSearchPath}" method="post">
              <input type="text" name="title" class="title" placeholder="Title">
              <textarea
              name="text"
              cols="30"
              rows="10"
              class="text"
              placeholder="text"></textarea>
                <div class="btnWrap">
                  <input type="submit" value="SAVE" class="btn">
                </div>
              </form>
            </article>
            `
            }
            res.writeHead(200);
            res.end(template(css, newLog(urlSearchPath), listAdd(directory), urlSearchPath));
        } else if (urlSearchType === '?path='){
          fs.readFile(`./assets/data/${urlLint(urlSearchPath)}`,'UTF-8' ,(err, data) => {
            if (err) throw err

            res.writeHead(200);
            res.end(template(css, readNote(data, urlSearchPath), listAdd(directory), urlSearchPath));
          })
        } else {
          fs.readdir(`./assets/data/`,'UTF-8' ,(err, file) => {
            if (err) throw err

              res.writeHead(200);
              res.end(template(css, main(date), listAdd(directory), urlSearchPath));
          })
        }
      })
    })
  } else if(urlPath === '/save'){
    fs.readFile('assets/css/main.css','UTF-8',(err, css) => {
      if(err) throw err
      fs.readdir(`./assets/data`, (err, directory) => {
        if(err) throw err;
          fs.readFile(`./assets/data/${urlLint(directory[0])}`, 'UTF-8', (err, read) =>{
            if (err) throw err
            let body = '';

            req.on('data', (data) => {
              body += data;
            })

            req.on('end', () => {
              const post = qs.parse(body);
              const title = post.title;
              const text = post.text;

              let fileName = date;
              fs.writeFile(`./assets/data/${fileName}`, `title: ${title} text: ${text} date: ${date}`, (err) => {
                if(err) throw err;
                
                res.writeHead(200);
                res.end(template(css, readNote(read, urlSearchPath), listAdd(directory), urlSearchPath));
            })
          })
        })
      })
    })
  } else if(urlPath === '/change'){
    fs.readFile('assets/css/main.css','UTF-8',(err, css) => {
      if(err) throw err
      fs.readdir(`./assets/data`, (err, directory) => {
        if(err) throw err;
        fs.readFile(`./assets/data/${urlLint(urlSearchPath)}`,'UTF-8' ,(err, data) => {
          if (err) throw err
        
          const startTitle = data.indexOf('title:');
          const startText = data.indexOf('text:');
          const startDate = data.indexOf('date:');
          const title = data.substring(startTitle+6, startText);
          const text = data.substring(startText+5, startDate);
          const date = data.substring(startDate+6);
          const article = `
            <article class="inputArea">
              <form action="/changeUpdate?path=${urlSearchPath}" method="post">
              <input type="text" name="title" class="title" placeholder="Title" value="${title}">
              <textarea
              name="text"
              cols="30"
              rows="10"
              class="text"
              placeholder="text"
              value="${text}"></textarea>
              <input type="hidden" name="beforeDate" value="${date}"></input>
                <div class="btnWrap">
                  <input type="submit" value="SAVE" class="btn">
                </div>
              </form>
            </article>
            `
          res.writeHead(200);
          res.end(template(css, article, listAdd(directory, urlSearchPath), urlSearchPath));
        })
      })
    })
   } else if(urlPath === '/changeUpdate'){
    fs.readFile('assets/css/main.css','UTF-8',(err, css) => {
      if(err) throw err
      fs.readdir(`./assets/data`, (err, directory) => {
        if(err) throw err;
        let body = '';

        req.on('data', (data) => {
          body += data;
        })

        req.on('end', () => {
          const post = qs.parse(body);

          const title = post.title;
          const text = post.text;
          const beforeDate = post.beforeDate;

          let fileName = beforeDate;
          fs.writeFile(`./assets/data/${fileName}`, `title: ${title} text: ${text} date: ${beforeDate}`, (err) => {
            if(err) throw err;
            fs.readFile(`./assets/data/${urlLint(urlSearchPath)}`, 'UTF-8', (err, read) =>{
              if (err) throw err
                
              res.writeHead(200);
              res.end(template(css, readNote(read, urlSearchPath), listAdd(directory), urlSearchPath));
            })
          })
        })
      })
    })
  } else if(urlPath === '/delete'){
    let body = '';

    req.on('data', (data) => {
      body += data;
    })

    req.on('end', () => {
      const post = qs.parse(body);
      const deleteItem = post.path;
      fs.unlink(`./assets/data/${urlLint(deleteItem)}`,(err) => {
        if(err) throw err;
        
        fs.readFile('assets/css/main.css','UTF-8',(err, css) => {
          if(err) throw err
          fs.readdir(`./assets/data`, (err, directory) => {
            if(err) throw err;
            res.writeHead(200);
            res.end(template(css, main(date), listAdd(directory), urlSearchPath));
          })
        })
      })
    })
  }else {
    res.writeHead(400);
    res.end('Not found');
  }
})

server.listen(3000);