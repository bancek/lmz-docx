# LMZ → Wordove enačbe

Spletno orodje za pretvorbo matematičnih formul iz linearnega zapisa (LMZ ali LaTeX) v nativne Wordove enačbe (`.docx`).

**Spletna stran:** [https://bancek.github.io/lmz-docx](https://bancek.github.io/lmz-docx)

---

## O zapisu LMZ

**LMZ** = Linearni matematični zapis za slepe (Center IRIS, 2019).

**Vir:**
- DOCX: [dostopno_za-slepe_LMZ_Linearni-matematični-zapis-za-slepe.docx](http://center-iris.si/files/2019/10/dostopno_za-slepe_LMZ_Linearni-matemati%C4%8Dni-zapis-za-slepe.docx)
- PDF: [Linearni-matematični-zapis-za-slepe.pdf](http://center-iris.si/files/2019/10/Linearni-matemati%C4%8Dni-zapis-za-slepe.pdf)

LMZ posnema skladnjo argumentov v LaTeXu, zato je večina ukazov neposredno preimenovanje (npr. `\ul{6}{3}` &rarr; `\frac{6}{3}`). Le infiksni ukaz `\nad` zahteva strukturno preureditev (v `\binom`). Kemične vezi (`\1vez` ...) niso podprte.

---

## Uporaba

1. Odprite povezavo [https://bancek.github.io/lmz-docx](https://bancek.github.io/lmz-docx).
2. Izberite način vnosa (**LMZ** ali **LaTeX**).
3. Vnesite formule (ena na vrstico; vrstice z `%` so komentarji).
4. Kliknite **Prenesi vse .docx** ali prenesite posamezno formulo.

## Testi

Za zagon enotnih testov pretvornika:

```bash
node --test
```
