const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const config = require("./config");
const pdfToHtml = require("./pdf-to-html");

const getDirs = () => {
    return config.PDF_DIRS.DEFAULT;
}

const getData = ($, allParagraphs) => {
    const PDF_DATA = {};
    const cb = (p, index) => {
        const pText = $(p).text();
        try {
            console.log(`p${index}: `, pText);
        } catch(error) {
            PDF_DATA.hasError = true;
            console.log('ERROR:', error);
        }
    };
    if (typeof allParagraphs.each === 'function') {
        allParagraphs.each((index, p) => cb(p, index));
    } else {
        allParagraphs.forEach(cb);
    }
    return PDF_DATA;
}

const dataFromHtmlHandler = (data, filename) => {
    const $ = cheerio.load(data);
    const allParagraphs = $("p");

    console.log("==================================");
    const factureData = getData($, allParagraphs);
    factureData.FILENAME = `${path.basename(filename)}`;
    console.log('PDF_DATA: ', factureData);
    console.log("=======================");
}

const getPath = (filename) => {
    return path.resolve(getDirs(), filename);
}

const files = fs.readdirSync(getDirs());

const main = async () => {
    const EXTENSION = /(\.pdf)$/i;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.match(EXTENSION)) {
            console.log(`****** ${file} ******`);
            const data = await pdfToHtml.getHtml(getPath(file));
            dataFromHtmlHandler(data, file);
        }
        setTimeout(() => {}, 2000);
    }
}

main().then(() => {
    console.log('-----END-----');
}).catch(err => {
    console.log('------ CAN NOT EXECUTE THE TRAITEMENT -------');
    console.log('------ REASON: ', err);
});