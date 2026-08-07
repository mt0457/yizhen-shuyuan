var k = '甲子.+*()[]\';
var special = '.*+?^${}()|[]\';
var esc = k;
for (var si = 0; si < special.length; si++) {
  var ch = special[si];
  esc = esc.split(ch).join('\' + ch);
}
console.log('Input:', k);
console.log('Escaped:', esc);
var re = new RegExp(esc, 'g');
console.log('Regex OK:', re);
