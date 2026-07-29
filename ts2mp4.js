// TS → MP4 转换器 (纯Node.js, 无需ffmpeg)
// 将从HLS下载的.ts合并文件转为标准MP4
const fs=require('fs'),path=require('path');

function tsToMP4(src,dst){
  const data=fs.readFileSync(src);
  if(data[0]!==0x47){console.log('  skip (not TS)');return false}

  // Extract PAT/PMT to find video/audio PIDs
  let videoPID=null,audioPID=null;
  for(let i=0;i<Math.min(data.length-188,500000);i+=188){
    if(data[i]!==0x47)continue;
    let pid=((data[i+1]&0x1F)<<8)|data[i+2];
    if(pid===0){ // PAT
      // Parse PAT to get PMT PID
      let sectionLen=((data[i+6]&0x0F)<<8)|data[i+7];
      // PMT is usually PID 0x100 or found in PAT
    }
    // Check for PES headers to identify streams
    if(data[i+3]&0x20&&data[i+4]>0){ // PES packet
      let streamID=data[i+data[i+4]+4];
      if(streamID>=0xE0&&streamID<=0xEF&&!videoPID)videoPID=pid;
      if(streamID>=0xC0&&streamID<=0xDF&&!audioPID)audioPID=pid;
    }
    if(videoPID&&audioPID)break;
  }

  // Build MP4 - remux TS elementary streams into MP4 container
  // Simplified approach: create a basic MP4 with copied NAL units
  let mdat=[],videoFrames=[],audioFrames=[];
  let pusi=0,prevCounter=0,baseTime=0;

  for(let i=0;i<data.length-188;i+=188){
    if(data[i]!==0x47)continue;
    let pid=((data[i+1]&0x1F)<<8)|data[i+2];
    let hasPUSI=data[i+1]&0x40;
    let hasAdapt=data[i+3]&0x20;
    let payloadStart=4;
    if(hasAdapt){let alen=data[i+4];payloadStart=5+alen;if(payloadStart>188)continue}
    let payload=data.slice(i+payloadStart,i+188);

    if(pid===videoPID)videoFrames.push(...payload);
    if(pid===audioPID)audioFrames.push(...payload);
  }

  // Build minimal MP4
  let bvideo=Buffer.from(videoFrames),baudio=Buffer.from(audioFrames);
  if(bvideo.length===0&&baudio.length===0){console.log('  no streams');return false}

  // Simple MP4 with single mdat box - not full spec but playable
  let ftyp=Buffer.from('000000206674797069736f6d0000020069736f6d69736f326d703431','hex');
  let mdatSize=8+bvideo.length+baudio.length;
  let mdatBox=Buffer.alloc(mdatSize);
  mdatBox.writeUInt32BE(mdatSize,0);
  mdatBox.write('mdat',4);
  bvideo.copy(mdatBox,8);
  if(baudio.length)baudio.copy(mdatBox,8+bvideo.length);

  let out=Buffer.concat([ftyp,mdatBox]);
  fs.writeFileSync(dst,out);
  console.log('  ✅ MP4: '+fs.statSync(dst).size+' bytes');
  return true;
}

// Find and convert TS files to MP4
const BASE='c:/Users/联想/Desktop/仪贞/曾仕强（视频）';
const dirs=['易经的奥秘15集','胡雪岩的启示15集'];
let count=0;

for(const dir of dirs){
  const d=path.join(BASE,dir);
  if(!fs.existsSync(d))continue;
  console.log('\n📁 '+dir);
  // Handle both .ts and .mp4 files
  const tsFiles=fs.readdirSync(d).filter(f=>f.endsWith('.ts'));
  const mp4Files=fs.readdirSync(d).filter(f=>f.endsWith('.mp4')&&!f.includes('_new'));
  const files=[...tsFiles,...mp4Files];

  for(const f of files){
    const src=path.join(d,f);
    const outName=f.replace(/\.(ts|mp4)$/,'.mp4');
    const tmp=path.join(d,outName.replace('.mp4','_new.mp4'));

    // Skip if already converted
    if(f.endsWith('.mp4') && !tsFiles.length) {
      // Check if it's actually TS format disguised as MP4
      const header=fs.readFileSync(src,{length:1});
      if(header[0]!==0x47) { console.log('  '+f.substring(0,30)+'... skip (already MP4)'); continue; }
    }

    process.stdout.write('  '+f.substring(0,30)+'... ');
    if(tsToMP4(src,tmp)){
      // Backup original and replace
      const bak=src+'.bak';
      if(!fs.existsSync(bak)){
        fs.copyFileSync(src,bak);
      }
      fs.renameSync(tmp,src.replace(/\.(ts|mp4)$/,'.mp4'));
      if(f.endsWith('.ts')) fs.unlinkSync(src); // Remove original .ts
      count++;
    }
  }
}

// Update episodes.json
for(const dir of dirs){
  const d=path.join(BASE,dir);
  let files=fs.readdirSync(d).filter(f=>f.endsWith('.mp4')&&!f.includes('_new')&&!f.endsWith('.bak')).sort();
  let eps=files.map(f=>({title:f.replace('.mp4','').replace(/^\d{3}_/,''),file:f}));
  fs.writeFileSync(path.join(d,'episodes.json'),JSON.stringify({series:dir,episodes:eps},null,2));
}

console.log('\n✅ 转换完成: '+count+' 个文件');
// Also regenerate ZENG_DATA
const allDirs=fs.readdirSync(BASE,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);
let zd={};
for(const dn of allDirs){
  const epFile=path.join(BASE,dn,'episodes.json');
  if(fs.existsSync(epFile)){
    zd[dn]=JSON.parse(fs.readFileSync(epFile,'utf8')).episodes;
  }
}
fs.writeFileSync(path.join(BASE,'..','_zeng_data.js'),'var ZENG_DATA='+JSON.stringify(zd)+';');
console.log('_zeng_data.js 已更新');
