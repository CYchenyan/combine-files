/**需求
我们要开发的是一个简单的静态文件合并服务器，该服务器需要支持类似以下格式的JS或CSS文件合并请求。

http://assets.example.com/foo/??bar.js,baz.js
在以上URL中，??是一个分隔符，之前是需要合并的多个文件的URL的公共部分，之后是使用,分隔的差异部分。因此服务器处理这个URL时，返回的是以下两个文件按顺序合并后的内容。

/foo/bar.js
/foo/baz.js
另外，服务器也需要能支持类似以下格式的普通的JS或CSS文件请求。

http://assets.example.com/foo/bar.js
以上就是整个需求
**/

let fs = require("fs");
let path = require("path");
let http = require("http");

let MIME = {
  '.css': 'text/css',
  '.js': 'application/javascript'
};

function combineFiles(pathnames, callback){
  let output = [];

  (function next(i, len){
    if(i < len){
      fs.readFile(pathnames[i], (err, data) => {
        if(err){
          callback(err)
        } else {
          output.push[data];
          next(i++, len);
        }
      })
    } else {
      callback(null, Buffer.concat(output))
    }
  }(0, pathnames.length))
}

function main(argv) {
  // let config = JSON.parse(fs.readFileSync(argv[0], 'utf-8'));
  // let root = config.root || '.';
  // let port = config.port || 80;
  let root = __dirname;
  let port = 8300;


  http.createServer((request, response) => {
    const urlInfo = parseUrl(root, request.url);

    /* combineFiles(urlInfo.pathnames, (err, data) => {
      if(err) {
        response.writeHead(404);
        response.end(err.message);
      } else {
        response.writeHead(200, {
          'Content-Type': urlInfo.mime
        });
        response.end(data);
      }
    }) */

    validateFiles(urlInfo.pathnames, (err, pathnames) => {
      console.log(pathnames);
      if(err){
        response.writeHead(404);
        response.end(err.message);
      } else {
        response.writeHead(200);

        outputFiles(pathnames, response);
      }
    })

  }).listen(port);
}

function outputFiles(pathnames, writer) {
  (function next(i, len) {
    if(i<len){
      let reader = fs.createReadStream(pathnames[i]);

      reader.pipe(writer, { end: false });
      reader.on("end",function () {
        next(i++, len)
      })
    } else {
      writer.end();
    }
  })(0, pathnames.length)
}

function validateFiles(pathnames, callback) {
  (function next(i, len) {
    if(i<len){
      fs.stat(pathnames[i], (err, stats) => {
        if(err){
          callback(err);
        } else if(!stats.isFile()){
          callback(new Error())
        } else {
          next(i++, len)
        }
      })
    } else {
      callback(null, pathnames)
    }
  })(0, pathnames.length);
}

function parseUrl(root, url){
  let base, pathnames, parts;

  if(url.indexOf("??") === -1) {
    url = url.replace("/", "/??")
  }

  parts = url.split("??");
  base = parts[0];

  pathnames = parts[1].split(",").map(value => (path.join(root, base, value)));

  return {
    mime: MIME[path.extname(pathnames[0])] || 'text/plain',
    pathnames
  }
}

main(process.argv.slice(2));