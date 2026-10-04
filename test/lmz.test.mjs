import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Extract the pure LMZ translator from index.html (between the markers) so we
// can unit-test the exact code that ships, without a browser or a build step.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Extract a marker-delimited pure block from index.html and evaluate it.
function extractBlock(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  assert.notEqual(start, -1, `missing marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing marker: ${endMarker}`);
  assert.ok(end > start, `markers out of order: ${startMarker}`);
  return html.slice(start + startMarker.length, end);
}

const { translateLMZ, SAMPLE_LMZ, SAMPLE_LATEX, sampleFor, sampleToLatex } =
  new Function(
    extractBlock('/* ==== LMZ TRANSLATOR (pure) START ==== */', '/* ==== LMZ TRANSLATOR (pure) END ==== */') +
      '\nreturn { translateLMZ, SAMPLE_LMZ, SAMPLE_LATEX, sampleFor, sampleToLatex };'
  )();

const escapeOmmlText = new Function(
  extractBlock('/* ==== OMML ESCAPE (pure) START ==== */', '/* ==== OMML ESCAPE (pure) END ==== */') +
    '\nreturn escapeOmmlText;'
)();

// Examples taken from the official spec (Center IRIS, LMZ 2019).
const cases = [
  // fractions (including nested / double fractions)
  ['\\ul{6}{3}=2', '\\frac{6}{3}=2'],
  ['3\\ul{1}{2} =\\ul{7}{2}', '3\\frac{1}{2} =\\frac{7}{2}'],
  ['\\ul{x +1}{x -1} =z', '\\frac{x +1}{x -1} =z'],
  ['\\ul{\\ul{x +1}{2}}{\\ul{x^{2} -1}{8}} =', '\\frac{\\frac{x +1}{2}}{\\frac{x^{2} -1}{8}} ='],
  // roots
  ['\\kor{x -1} =y', '\\sqrt{x -1} =y'],
  ['\\kor[3]{x}', '\\sqrt[3]{x}'],
  // sets / relations
  ['x \\el N', 'x \\in N'],
  ['x \\nel R', 'x \\notin R'],
  ['A \\uni B \\pre C', 'A \\cup B \\cap C'],
  ['A \\podm B \\npodm C', 'A \\subset B \\not\\subset C'],
  ['R_{0}^{+} =[0, \\nesk)', 'R_{0}^{+} =[0, \\infty)'],
  // limits / sums pass through, \\v / \\nesk translate
  ['\\lim_{x \\v \\nesk} a^{x} =0', '\\lim_{x \\to \\infty} a^{x} =0'],
  ['\\sum_{i=1}^{n} i', '\\sum_{i=1}^{n} i'],
  // Greek
  ['\\alfa \\le \\beta \\sledi \\gama >0', '\\alpha \\le \\beta \\Rightarrow \\gamma >0'],
  ['\\mi \\ni \\ro \\fi \\hi \\omikron', '\\mu \\nu \\rho \\phi \\chi ο'],
  // logic / geometry
  ['\\neg A \\hkrati B \\ali C', '\\neg A \\land B \\lor C'],
  ['\\vsak x \\el A \\eks y', '\\forall x \\in A \\exists y'],
  ['a \\pk b \\vz c', 'a \\perp b \\parallel c'],
  ["\\tri ABC \\sklad \\tri A'B'C'", "\\triangle ABC \\cong \\triangle A'B'C'"],
  // vectors / overline
  ['\\vek{AB} +\\vek{x} =\\vek{AD}', '\\vec{AB} +\\vec{x} =\\vec{AD}'],
  ['\\črta{15}', '\\overline{15}'],
  // binomial (both shapes)
  ['(n \\nad k)', '\\binom{n}{k}'],
  ['(x +1) \\nad y', '\\binom{x +1}{y}'],
  ['C_{n}^{r} =(n \\nad r)', 'C_{n}^{r} =\\binom{n}{r}'],
  // operators (surrounding spaces normalized)
  ['2*3', '2 \\cdot 3'],
  ['2 * 3', '2 \\cdot 3'],
  ['6:3', '6 \\div 3'],
  ['6 : 3', '6 \\div 3'],
  ['10 <=x <=20', '10 \\le x \\le 20'],
  ['-20 >=y >=-50', '-20 \\ge y \\ge -50'],
  ['\\ul{2 *\\kor{7}}{7}', '\\frac{2 \\cdot \\sqrt{7}}{7}'],
  // misc
  ['\\promil', '\\text{‰}'],
  ['5 \\ne |24', '5 \\nmid 24'],
  ['5 \\ne | 24', '5 \\nmid 24'],
  // LaTeX commands that are not LMZ aliases pass through unchanged
  ['\\frac{a}{b} +\\sqrt{x}', '\\frac{a}{b} +\\sqrt{x}'],
];

for (const [input, expected] of cases) {
  test(`translateLMZ(${JSON.stringify(input)})`, () => {
    assert.equal(translateLMZ(input), expected);
  });
}

// Guard the exact-token lookup against prefix collisions.
test('prefix collisions resolve to the whole command token', () => {
  assert.equal(translateLMZ('\\nesk'), '\\infty');
  assert.equal(translateLMZ('\\ne'), '\\ne');
  assert.equal(translateLMZ('\\nel'), '\\notin');
  assert.equal(translateLMZ('\\nen'), '\\ne');
  assert.equal(translateLMZ('\\presl'), '\\mapsto');
  assert.equal(translateLMZ('\\pre'), '\\cap');
  assert.equal(translateLMZ('\\vz'), '\\parallel');
  assert.equal(translateLMZ('\\v'), '\\to');
  assert.equal(translateLMZ('\\vek{a}'), '\\vec{a}');
});

test('a bare percent becomes \\%', () => {
  assert.equal(translateLMZ('70 % =0,7'), '70 \\% =0,7');
});

// Commands that are unique to LMZ must not survive translation of the sample.
const LMZ_ONLY =
  /\\(?:ul|kor|vek|črta|alfa|gama|jota|kapa|mi|ni|ksi|omikron|ro|ipsilon|fi|hi|el|nel|uni|pre|podm|npodm|nesk|nen|prib|soraz|pdb|hkrati|ali|sledi|ekv|vsak|eks|pk|vz|nvz|tri|kot|sklad|presl|komp|promil|nad|v)\b/;

test('every formula in the reference sample translates cleanly', () => {
  const formulas = SAMPLE_LMZ.split('\n').filter((l) => {
    const t = l.trim();
    return t && !t.startsWith('%');
  });
  assert.ok(formulas.length > 50, 'reference sample should be sizable');
  for (const line of formulas) {
    const out = translateLMZ(line.trim());
    assert.ok(!LMZ_ONLY.test(out), `leftover LMZ command: ${line} -> ${out}`);
    assert.ok(!/^\s*$/.test(out), `empty translation for: ${line}`);
  }
});

test('the LaTeX sample is derived from the LMZ sample', () => {
  assert.equal(SAMPLE_LATEX, sampleToLatex(SAMPLE_LMZ));
  assert.equal(sampleFor('lmz'), SAMPLE_LMZ);
  assert.equal(sampleFor('latex'), SAMPLE_LATEX);
  assert.ok(SAMPLE_LATEX.includes('\\frac{6}{3}'));
  assert.ok(SAMPLE_LATEX.includes('\\infty'));
  assert.ok(SAMPLE_LATEX.includes('\\cdot'));
});

// mathml2omml leaves raw <, > and & in text nodes; escaping them in <m:t> is
// what keeps document.xml valid (otherwise Word truncates at the first "<").
test('escapeOmmlText escapes XML-special characters inside <m:t>', () => {
  assert.equal(
    escapeOmmlText('<m:oMath><m:r><m:t>x<10</m:t></m:r></m:oMath>'),
    '<m:oMath><m:r><m:t>x&lt;10</m:t></m:r></m:oMath>'
  );
  assert.equal(escapeOmmlText('<m:t>y>15</m:t>'), '<m:t>y&gt;15</m:t>');
  assert.equal(escapeOmmlText('<m:t>a&b</m:t>'), '<m:t>a&amp;b</m:t>');
  assert.equal(
    escapeOmmlText('<m:t xml:space="preserve">n∈N;2<n≤8</m:t>'),
    '<m:t xml:space="preserve">n∈N;2&lt;n≤8</m:t>'
  );
  // markup outside <m:t> must be left untouched
  assert.equal(
    escapeOmmlText('<m:f><m:num><m:r><m:t>x</m:t></m:r></m:num></m:f>'),
    '<m:f><m:num><m:r><m:t>x</m:t></m:r></m:num></m:f>'
  );
});
