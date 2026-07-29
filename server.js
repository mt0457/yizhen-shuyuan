// 仪贞书院本地服务器 - 解决file://视频播放限制
// 用法: node server.js  然后浏览器打开 http://localhost:8765
var http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
var ROOT=__dirname;
var MIME={
  '.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8',
  '.mp4':'video/mp4','.ts':'video/mp2t','.jpg':'image/jpeg','.png':'image/png','.json':'application/json',
  '.ico':'image/x-icon','.svg':'image/svg+xml','.woff2':'font/woff2'
};
http.createServer(function(req,res){
  var u=url.parse(req.url).pathname;
  var method=req.method.toUpperCase();

  // Cover save API — writes covers to _covers.js + covers/ directory on disk
  if(method==='POST'&&u==='/save-covers'){
    var body='';
    req.on('data',function(c){body+=c;});
    req.on('end',function(){
      try{
        var data=JSON.parse(body);
        var coversDir=path.join(ROOT,'covers');
        if(!fs.existsSync(coversDir)) fs.mkdirSync(coversDir);
        var fileCount=0;
        Object.keys(data).forEach(function(id){
          var cover=data[id];
          if(cover&&cover.indexOf('data:image/')===0){
            var ext=cover.match(/data:image\/(jpeg|png|webp|gif)/);
            var suffix=ext?'.'+ext[1]:'.jpg';
            var base64=cover.replace(/^data:image\/[^;]+;base64,/,'');
            var buf=Buffer.from(base64,'base64');
            fs.writeFileSync(path.join(coversDir,id+suffix),buf);
            data[id]='covers/'+id+suffix;
            fileCount++;
          }
        });
        var js='var COVERS_DATA = '+JSON.stringify(data,null,2)+';\n';
        fs.writeFileSync(path.join(ROOT,'_covers.js'),js,'utf8');
        console.log('Covers saved: '+Object.keys(data).length+' in _covers.js, '+fileCount+' files');
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true,count:Object.keys(data).length,files:fileCount}));
      }catch(e){
        res.writeHead(500);res.end(JSON.stringify({ok:false,error:e.message}));
      }
    });
    return;
  }

  if(u==='/')u='/仪贞书院.html';
  var fp=path.join(ROOT,decodeURIComponent(u));
  fs.stat(fp,function(err,stat){
    if(err){res.writeHead(404);res.end('Not Found: '+u);return}
    var ext=path.extname(fp).toLowerCase(),mt=MIME[ext]||'application/octet-stream';
    if(ext==='.mp4'||ext==='.ts'){
      var range=req.headers.range,total=stat.size;
      if(range){
        var parts=range.replace(/bytes=/,'').split('-');
        var start=parseInt(parts[0]),end=parts[1]?parseInt(parts[1]):total-1;
        res.writeHead(206,{'Content-Range':'bytes '+start+'-'+end+'/'+total,'Accept-Ranges':'bytes','Content-Length':end-start+1,'Content-Type':mt});
        fs.createReadStream(fp,{start:start,end:end}).pipe(res);
      }else{
        res.writeHead(200,{'Content-Length':total,'Content-Type':mt,'Accept-Ranges':'bytes'});
        fs.createReadStream(fp).pipe(res);
      }
    }else{
      fs.readFile(fp,function(err,data){if(err){res.writeHead(500);res.end('Error')}else{res.writeHead(200,{'Content-Type':mt});res.end(data)}});
    }
  });
}).listen(8765);
console.log('仪贞书院服务器已启动: http://localhost:8765');
