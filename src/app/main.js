const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const tabula = require('tabula-js');

const config = require("./config");
const pdfToHtml = require("./pdf-to-html");
const { exec } = require('child_process');

const getDirs = () => {
    return config.PDF_DIRS.DEFAULT;
}

const extractInfoTurbine = (data) => {
    const pageBreak = /page\s*[3-9][0-9]*/;
    const results = {
        CONTRACTOR: '',
        EXPERT: '',
        DATE_OF_EXPERTISE: '',
        SITE: '',
        REFERENCE: '',
        VALIDATED_BY: '',
        DATE_VALIDATION: '',
        MACHINE_TYPE: '',
        NUM_SERIE: '',
        WIND_PARK: '',
        WTG_TYPE: '',
        OBJECT: '',
        SCOPE: '',
        CUSTOMER: '',
        REPORT_NAME: '',
        PROJECT_ENGINEER: '',
        SUBCONTRACTOR: ''
    };
    const PATTERNS = [
        {
            pattern: /(Contractor\s*:)|(Recipient\s*:)|(Prestataire\s*:)/i,
            field: 'CONTRACTOR'
        },
        {
            pattern: /Expert\s*:/i,
            field: 'EXPERT'
        },
        {
            pattern: /Date((\s+of\s+)|(\s+d\s*.\s*))expertise\s*:/i,
            field: 'DATE_OF_EXPERTISE'
        },
        {
            pattern: /R[ée]f[ée]rence\s*:/i,
            field: 'REFERENCE'
        },
        {
            pattern: /Validated\s+by\s*:/i,
            field: 'VALIDATED_BY'
        },
        {
            pattern: /Machine\s+type\s*:/i,
            field: 'MACHINE_TYPE'
        },
        {
            pattern: /(Serial\s+Nu\s*mber)|(Wind\s+farm\s+and\s+no.\s+In\s+farm)\s*:/i,
            field: 'NUM_SERIE'
        },
        {
            pattern: /Wind\s+Park\s*:/i,
            field: 'WIND_PARK'
        },
        {
            pattern: /Site\s*:/i,
            field: 'SITE'
        },
        {
            pattern: /Date\s+(of|de)\s+validation\s*:/i,
            field: 'DATE_VALIDATION'
        },
        {
            pattern: /(WTG.Type\s*:)|(Type\s+WTG\s*:)/i,
            field: 'WTG_TYPE'
        },
        {
            pattern: /(Scope\s*:)|(Champ\s*d\s*.\s*application\s*:)/i,
            field: 'SCOPE'
        },
        {
            pattern: /(Customer\s*:)|(Client\s*:)/i,
            field: 'CUSTOMER'
        },
        {
            pattern: /(Report\s*name:\s*:)|(Nom\s*du\s*rapport\s*:)/i,
            field: 'REPORT_NAME'
        },
        {
            pattern: /(Project\s*Engineer\s*:)|(Ing[ée]nieur\s*de\s*projet\s*:)/i,
            field: 'PROJECT_ENGINEER',
        },
        {
            pattern: /(Subcontractor\s*:)/i,
            field: 'SUBCONTRACTOR',
        },
        {
            pattern: /(Object\s*:)|(Objet\s*:)/i,
            field: 'OBJECT',
            multiline: true
        },
    ];

    for(let i = 0; i < data.length; i++) {
        const pText = data[i];
        if(pageBreak.test(pText)) {
            break;
        }
        for(let pi in PATTERNS) {
            const pattern = PATTERNS[pi];
            const matches = pText.match(pattern.pattern);
            if (matches && !results[pattern.field]) {
                results[pattern.field] = pText.replace(pattern.pattern, '').trim();
            }
        }
    }
    return results;
}

const extractProductionData = (index, data) => {
    const results = {
        MINIMAL_POWER: '',
        HUB_HEIGHT: '',
        ROTOR_DIAMETER: '',
        MAX_POWER: '',
        DATE_COMMISSIONING: '',
        HOUR_OPERATION: '',
        CONSUMPTION: '',
        ENERGY_PRODUCTION: ''
    };
    const PATTERNS = [
        {
            pattern: /(Nominal\s*power|Puissance\s*Nominale)\s*:/i,
            field: 'MINIMAL_POWER'
        },
        {
            pattern: /(Hub\s*height|Hauteur\s*du\s*moyeu)\s*:/i,
            field: 'HUB_HEIGHT'
        },
        {
            pattern: /(Rotor\s*diameter|Diam[ée]tre\s*du\s*rotor)\s*:/i,
            field: 'ROTOR_DIAMETER'
        },
        {
            pattern: /(Maximum\s*power|Puissance\s*Maximale)\s*:/i,
            field: 'MAX_POWER'
        },
        {
            pattern: /(Date\s*of\s*commissioning|Date\s*de\s*mise\s*en\s*service)\s*:/i,
            field: 'DATE_COMMISSIONING'
        },
        {
            pattern: /(Hours\s*of\s*operation|Heures\s*de\s*fonctionnement)\s*:/i,
            field: 'HOUR_OPERATION'
        },
        {
            pattern: /Consumption\s*:/i,
            field: 'CONSUMPTION'
        },
        {
            pattern: /(Produced\s*energy|Energie\s*produite)\s*:/i,
            field: 'ENERGY_PRODUCTION'
        }
    ];
    if (/^B.[0-9]/.test(data[index + 1])) {
        return results;
    }
    let lim = 20;
    for(let i = index + 1; i < data.length && lim-- > 0; i++) {
        const pText = data[i];
        for(let pi in PATTERNS) {
            const pattern = PATTERNS[pi];
            const matches = pText.match(pattern.pattern);
            if (matches && !results[pattern.field]) {
                results[pattern.field] = pText.replace(pattern.pattern, '').trim();
            }
        }
    }
    return results;
}

const extractExpertiseDetails = (index, data) => {
    const results = {
        TITLE: '',
        DATA: []
    };
    const EXPERTISE_DETAILS = /^D.[0-9]\s*(.*)$/;
    const BREAK = /(^D\s*\.\s*[0-9]+)|(^E\s*\.\s*[0-9]*)/;
    const LINE_HEADER = /^\s*([0-9]+)\s*([A-Z]+)/;
    const PAGE_BREAK = /^page\s*[0-9]+/;
    const QUOTES = /"/g;
    let matches = data[index].match(EXPERTISE_DETAILS);
    if (matches) {
        results.TITLE = matches[1];
        for(let i = index + 1; i < data.length; i++) {
            let text = data[i].replace(QUOTES, '');
            if (BREAK.test(text)) {
                break;
            }
            matches = text.match(LINE_HEADER);
            if (matches) {
                const elem = {};
                elem.ID = matches[1];
                elem.CRITICITY = matches[2];
                elem.TEXT = text.replace(LINE_HEADER, '').trim();
                while(++i < data.length) {
                    text = data[i].replace(QUOTES, '');
                    if (PAGE_BREAK.test(text) || LINE_HEADER.test(text)) {
                        i--;
                        break;
                    }
                    if (/^\s*-\s*/.test(text)) {
                        elem.TEXT = `${elem.TEXT}\n${text}`
                    } else {
                        elem.TEXT = `${elem.TEXT} ${text}`;
                    }
                }
                results.DATA.push(elem);
            }
        }
    }
    if (results.DATA.length < 1) {
        return false;
    }
    return results;
};

const getPath = (filename) => {
    return path.resolve(getDirs(), filename);
}

const files = fs.readdirSync(getDirs());

const getPdfData = (filename, stdout) => {
    const lines = stdout.split(/(?:\r)*\n/);
    const PDF_DATA = {
        FILENAME: path.basename(filename),
        INFO_TURBINE: extractInfoTurbine(lines),
        EXPERTISE_DETAILS: []
    };
    const PRODUCTION_DATA_PATTERN = /[A-Z].[0-9]\s*(Production\s*data|Donn[ée]es\s*de\s*production)\s*$/;
    const EXPERTISE_DETAILS = /^D\s*.\s*[0-9]+/;
    for(let i = 0; i < lines.length; i++) {
        const text = lines[i];
        if (PRODUCTION_DATA_PATTERN.test(text)) {
            PDF_DATA.PRODUCTION_DATA = extractProductionData(i, lines);
        }
        if (EXPERTISE_DETAILS.test(text)) {
            const expertiseDetails = extractExpertiseDetails(i, lines);
            if (expertiseDetails) {
                PDF_DATA.EXPERTISE_DETAILS.push(expertiseDetails);
            }
        }
    }
    return PDF_DATA;
}

const tabulaHandler = (filename) => {
    return new Promise((resolve, reject) => {
        const cmd = `java -jar "${config.TAPULA_PATH}" --pages all -c 10000 "${filename}"`
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
              return reject(err);
            }
            return resolve(getPdfData(filename, stdout));
        });
    });
}

const main = async () => {
    const EXTENSION = /(\.pdf)$/i;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.match(EXTENSION)) {
            console.log(`****** ${file} ******`);
            const data =  await tabulaHandler(getPath(file));
            // console.log(JSON.stringify(data, null, 2));
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