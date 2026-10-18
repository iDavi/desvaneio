import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleLyrics,wordPosition} from '../src/songTimeline.js';
const phrases=[
 {start:1,end:4,words:[{text:'one',start:1,end:1.5},{text:'two',start:2,end:2.5}]},
 {start:5,end:8,words:[{text:'three',start:5,end:5.5},{text:'four',start:6,end:6.5}]},
];
test('lyrics follow playback time, clear in gaps, and restore correctly when seeking backward',()=>{
 assert.equal(visibleLyrics(phrases,0),null);
 assert.deepEqual(visibleLyrics(phrases,1.2).words.map(w=>w.text),['one']);
 assert.deepEqual(visibleLyrics(phrases,3).words.map(w=>w.text),['two']);
 assert.equal(visibleLyrics(phrases,4.5),null);
 assert.equal(visibleLyrics(phrases,7).index,1);
 assert.deepEqual(visibleLyrics(phrases,1.2).words.map(w=>w.text),['one']);
 assert.equal(visibleLyrics(phrases,8),null);
});
test('readable rows reserve future words and reduced motion always uses rows',()=>{
 const row=visibleLyrics(phrases,5.1);assert(row.row);
 assert.equal(row.words.length,2);assert(row.words[0].visible);assert(!row.words[1].visible);
 assert(visibleLyrics(phrases,1.1,true).row);
});
test('word positions repeat deterministically and use distinct safe cells',()=>{
 for(let p=0;p<30;p++){
  const cells=new Set();
  for(let w=0;w<9;w++){
   const pos=wordPosition(p,w);assert.deepEqual(pos,wordPosition(p,w));
   assert(pos.x>=14&&pos.x<=86);assert(pos.y>=26&&pos.y<=74);
   cells.add(`${Math.round((pos.x-18)/32)},${Math.round((pos.y-30)/20)}`);
  }
  assert.equal(cells.size,9);
 }
});

test('the song cues are ordered, stay inside the recording, and leave the instrumental break empty',async()=>{
 const {readFile}=await import('node:fs/promises');
 const cues=JSON.parse(await readFile(new URL('../src/csirac-lyrics.json',import.meta.url),'utf8'));
 assert(cues.length>50);
 let end=0;
 for(const phrase of cues){
  assert(phrase.start>=end);assert(phrase.end>phrase.start&&phrase.end<=201.931);end=phrase.end;
  assert(phrase.words.length>0);let previous=phrase.start;
  for(const word of phrase.words){
   assert(word.text.trim());assert(word.start>=previous&&word.start>=phrase.start);
   assert(word.end>word.start&&word.end<=phrase.end);previous=word.start;
  }
 }
 assert.equal(visibleLyrics(cues,130),null);
 assert.equal(visibleLyrics(cues,201.931),null);
});
