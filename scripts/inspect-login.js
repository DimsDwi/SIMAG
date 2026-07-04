const fs = require('fs');
const html = fs.readFileSync('login.html', 'utf8');

// Find role tab buttons
const lines = html.split('\n');
lines.forEach((line, i) => {
  if (line.includes('role') || line.includes('tab') || line.includes('Admin') || line.includes('Dospem') || line.includes('Mitra')) {
    if (line.includes('button') || line.includes('click') || line.includes('selectRole') || line.includes('v-model') || line.includes('data-')) {
      console.log(`L${i+1}: ${line.trim().substring(0, 200)}`);
    }
  }
});

console.log('\n=== INPUT FIELDS ===');
const inputRe = /<input[^>]+>/g;
let m;
while ((m = inputRe.exec(html)) !== null) {
  console.log('INPUT:', m[0].substring(0, 200));
}
