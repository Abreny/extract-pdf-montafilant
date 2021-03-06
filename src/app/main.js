const fs = require("fs");
const path = require("path");
const tabula = require('tabula-js');
const { exec } = require('child_process');

const config = require("./config");
const dataWriter = require('./data-writer');

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
            pattern: /(Serial\s+Nu\s*mber|Wind\s+farm\s+and\s+no.\s+In\s+farm)\s*:/i,
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
            pattern: /(WTG.Type\s*:)/i,
            field: 'WTG_TYPE'
        },
        {
            pattern: /(Scope\s*:)/i,
            field: 'SCOPE',
            multiline: true
        },
        {
            pattern: /(Customer\s*:)/i,
            field: 'CUSTOMER'
        },
        {
            pattern: /(Report\s*name\s*:)/i,
            field: 'REPORT_NAME'
        },
        {
            pattern: /(Project\s*Engineer\s*:)/i,
            field: 'PROJECT_ENGINEER'
        },
        {
            pattern: /(Subcontractor\s*:)/i,
            field: 'SUBCONTRACTOR',
            multiline: true
        },
        {
            pattern: /(Object\s*:)/i,
            field: 'OBJECT',
            multiline: true
        },
    ];
    const QUOTES = /^"|"$/g;

    for(let i = 0; i < data.length; i++) {
        const pText = data[i];
        if(pageBreak.test(pText)) {
            break;
        }
        for(let pi in PATTERNS) {
            const pattern = PATTERNS[pi];
            const matches = pText.match(pattern.pattern);
            if (matches && !results[pattern.field]) {
                results[pattern.field] = pText.replace(pattern.pattern, '').replace(QUOTES, '').trim();
                if (pattern.multiline) {
                    let j = i + 1;
                    while(j < data.length && data[j].indexOf(':') < 0 && !pageBreak.test(data[j])) {
                        results[pattern.field] = `${results[pattern.field]} ${data[j].replace(QUOTES, '').trim()}`;
                        j++;
                    }
                }
            }
        }
    }
    const series = results.NUM_SERIE.replace(/"/g, '').trim().split(',');
    if (series.length > 1) {
        series.shift();
    }
    results.NUM_SERIE = series.join('');
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
            pattern: /(Nominal\s*power)\s*:/i,
            field: 'MINIMAL_POWER'
        },
        {
            pattern: /(Hub\s*height)\s*:/i,
            field: 'HUB_HEIGHT'
        },
        {
            pattern: /(Rotor\s*diameter)\s*:/i,
            field: 'ROTOR_DIAMETER'
        },
        {
            pattern: /(Maximum\s*power)\s*:/i,
            field: 'MAX_POWER'
        },
        {
            pattern: /(Date\s*of\s*commissioning)\s*:/i,
            field: 'DATE_COMMISSIONING'
        },
        {
            pattern: /(Hours\s*of\s*operation)\s*:/i,
            field: 'HOUR_OPERATION'
        },
        {
            pattern: /Consumption\s*:/i,
            field: 'CONSUMPTION'
        },
        {
            pattern: /Produced\s*energy\s*(?:\(.*\))?\s*:/i,
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
    const EXPERTISE_DETAILS = /^D.[0-9]*\s*(.*)$/;
    const BREAK = /(^D\s*\.\s*[0-9]*)|(^E\s*\.\s*[0-9]*)/;
    const LINE_HEADER = /^\s*([0-9]+)\s*(I|E|V|P\s+|PP\s+|PPP)/;
    const PAGE_BREAK = /^page\s*[0-9]+|page\s*[0-9]+$/i;
    const QUOTES = /^"|"$/g;
    let matches = data[index].replace(QUOTES, '').trim().match(EXPERTISE_DETAILS);
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
                elem.CRITICITY = matches[2].trim();
                elem.TEXT = text.replace(LINE_HEADER, '').trim();
                elem.COMMENT = '';
                let alreadyComment = false;
                while(++i < data.length) {
                    text = data[i].replace(QUOTES, '');
                    if (PAGE_BREAK.test(text) || BREAK.test(text) || LINE_HEADER.test(text)) {
                        i--;
                        break;
                    }
                    if (/^\s*-\s*/.test(text) || alreadyComment) {
                        alreadyComment = true;
                        elem.COMMENT = `${elem.COMMENT} ${text}`;
                    } else {
                        elem.TEXT = `${elem.TEXT} ${text}`;
                    }
                }
                elem.COMMENT = elem.COMMENT.trim();
                elem.TEXT = elem.TEXT.trim();
                results.DATA.push(elem);
            }
        }
    }
    if (results.DATA.length < 1) {
        return false;
    }
    return results;
};

const extractConclusion = (index, data) => {
    const results = {
        TITLE: '',
        DATA: []
    };
    const CONSLUSION_PATTERN = /^E.[0-9]*\s*(.*)$/;
    const BREAK = /(^E\s*\.\s*[0-9]*)|(^F\s*\.\s*[0-9]*)/;
    const PAGE_BREAK = /^page\s*[0-9]+|page\s*[0-9]+$/i;
    const PAGE_END = /^(Edit|publi.*)\s*[0-9]+/i;
    const QUOTES = /"/g;
    const DOT = /(.*):\s*$/;
    let matches = data[index].match(CONSLUSION_PATTERN);
    let conclusionId = 1;
    if (matches) {
        results.TITLE = matches[1];
        for(let i = index + 1; i < data.length; i++) {
            let text = data[i].replace(QUOTES, '');
            if (BREAK.test(text)) {
                break;
            }
            matches = text.match(DOT);
            if (matches) {
                const elem = {};
                elem.ID = `${conclusionId}-C`;
                elem.TITLE = matches[1].trim();
                elem.TEXT = '';
                elem.COMMENT = '';
                let alreadyComment = false;
                next_conclusion: while(++i < data.length) {
                    text = data[i].replace(QUOTES, '');
                    if (PAGE_BREAK.test(text)) {
                        while(++i < data.length) {
                            const lineText = data[i].replace(QUOTES, '');
                            if (PAGE_END.test(lineText)) {
                                continue next_conclusion;
                            }
                        }
                    }
                    if (DOT.test(text) || BREAK.test(text)) {
                        i--;
                        break;
                    }
                    if (/^\s*-\s*/.test(text) || alreadyComment) {
                        alreadyComment = true;
                        elem.COMMENT = `${elem.COMMENT} ${text}`
                    } else {
                        elem.TEXT = `${elem.TEXT} ${text}`;
                    }
                }
                elem.COMMENT = elem.COMMENT.trim();
                elem.TEXT = elem.TEXT.trim();
                results.DATA.push(elem);
                conclusionId++;
            }
        }
    }
    if (results.DATA.length < 1) {
        return false;
    }
    return results;
};
const extractComponents = (index, data) => {
    const results = {
        TITLE: '',
        DATA: []
    };
    const CONSLUSION_PATTERN = /^B.[0-9]+\s*(.*)$/;
    const BREAK = /(^C\s*\.\s*[0-9]*)|(^B\s*\.\s*[0-9]*)/;
    const PAGE_BREAK = /^page\s*[0-9]+|page\s*[0-9]+$/i;
    const PAGE_END = /^(Edit|publi.*)\s*[0-9]+/i;
    const QUOTES = /"|,/g;
    let matches = data[index].match(CONSLUSION_PATTERN);
    const extractLine = (line) => {
        const chars = line.split('');
        let curr = [];
        let hasQuote = false;
        let lineData = {
            code: 2,
            data: []
        };
        for(let i = 0; i < chars.length; i++) {
            if (chars[i] == '"') {
                hasQuote = !hasQuote;
            } else if (!hasQuote && chars[i] == ',') {
                const col = curr.join('').trim();
                if (col.toLowerCase() == 'component' || col.toLowerCase() == 'composant') {
                    lineData.code = 0;
                    return lineData;
                }
                if (BREAK.test(col)) {
                    lineData.code = -1;
                    return lineData;
                }
                if (col.length == 0) {
                    lineData.code = 1;
                }
                lineData.data.push(col);
                curr = [];
            } else {
                curr.push(chars[i]);
            }
        }
        const lastCol = curr.join('').trim();
        if (BREAK.test(lastCol)) {
            lineData.code = -1;
            return lineData;
        }
        lineData.data.push(lastCol);
        return lineData;
    };
    if (matches) {
        results.TITLE = matches[1].replace(/,/g, '').trim();
        let len = 0;
        next_component: for(let i = index + 1; i < data.length; i++) {
            if (PAGE_BREAK.test(data[i].replace(QUOTES, '').trim())) {
                while(++i < data.length) {
                    const lineText = data[i].replace(QUOTES, '').trim();
                    if (PAGE_END.test(lineText)) {
                        continue next_component;
                    }
                }
            }
            if (i >= data.length) {
                break;
            }
            const lineData = extractLine(data[i]);
            if (lineData.code == -1) {
                break;
            }
            if (lineData.code == 2) {
                results.DATA[len++] = lineData.data;
            } else if (lineData.code == 1 && len != 0) {
                for(let line_i in lineData.data) {
                    results.DATA[len - 1][line_i] = `${results.DATA[len - 1][line_i]} ${lineData.data[line_i]}`;
                    results.DATA[len - 1][line_i] = results.DATA[len - 1][line_i].trim();
                }
            }
        }
    }
    if (results.DATA.length < 1) {
        return false;
    }
    return results;
};
const extractComponentsV2 = (index, data) => {
    const results = {
        TITLE: '',
        DATA: []
    };
    const CONSLUSION_PATTERN = /^B.[0-9]+\s*(.*)$/;
    const BREAK = /(^C\s*\.\s*[0-9]*)|(^B\s*\.\s*[0-9]*)/;
    const PAGE_BREAK = /^page\s*[0-9]+|page\s*[0-9]+$/i;
    const PAGE_END = /^(Edit|publi.*)\s*[0-9]+/i;
    const QUOTES = /^"|"$/g;
    let matches = data[index].match(CONSLUSION_PATTERN);
    if (matches) {
        results.TITLE = matches[1].replace(/,/g, '').trim();
        results.IS_V2 = true;

        next_component: for(let i = index + 1; i < data.length && results.IS_V2; i++) {
            const text = data[i].replace(QUOTES, '').trim();
            if (PAGE_BREAK.test(text)) {
                while(++i < data.length) {
                    const lineText = data[i].replace(QUOTES, '').trim();
                    if (PAGE_END.test(lineText)) {
                        continue next_component;
                    }
                }
            }
            if (i >= data.length) {
                break;
            }
            if (BREAK.test(text)) {
                break;
            }
            if (/^(component|composant)/i.test(text)) {
                results.IS_V2 = false;
            }
            const elems = text.split(/\s+-\s+/);
            if (elems.length >= 2) {
                results.DATA.push(elems);
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

const getPdfData = (isTurbine, filename, stdout) => {
    const lines = stdout.split(/(?:\r)*\n/);
    const PDF_DATA = {
        FILENAME: path.basename(filename),
        INFO_TURBINE: isTurbine ? extractInfoTurbine(lines) : {},
        PRODUCTION_DATA: extractProductionData(0, ['', 'B.1']),
        EXPERTISE_DETAILS: [],
        CONCLUSION: [],
        COMPONENT: [],
        IS_SCAN: true
    };
    const PRODUCTION_DATA_PATTERN = /[A-Z].[0-9]\s*(Production\s*data|Donn[ée]es\s*de\s*production)\s*$/;
    const EXPERTISE_DETAILS = /^D\s*.\s*[0-9]+/;
    const CONCLUSION_DETAILS = /^E\s*.\s*[0-9]+\s*Conclusion/;
    const MAIN_COMPONENTS = /^B.[2-3]\s*/;
    const QUOTES = /^"|"$/g;
    
    for(let i = 0; i < lines.length; i++) {
        const text = lines[i].replace(QUOTES, '').trim();
        if (isTurbine) {
            if (PRODUCTION_DATA_PATTERN.test(text)) {
                PDF_DATA.PRODUCTION_DATA = extractProductionData(i, lines);
                PDF_DATA.IS_SCAN = false;
            }
            if (EXPERTISE_DETAILS.test(text)) {
                const expertiseDetails = extractExpertiseDetails(i, lines);
                if (expertiseDetails) {
                    PDF_DATA.EXPERTISE_DETAILS.push(expertiseDetails);
                    PDF_DATA.IS_SCAN = false;
                }
            }
            if (CONCLUSION_DETAILS.test(text)) {
                const conclusion = extractConclusion(i, lines);
                if (conclusion) {
                    PDF_DATA.CONCLUSION.push(conclusion);
                    PDF_DATA.IS_SCAN = false;
                }
            }
            if (MAIN_COMPONENTS.test(text)) {
                const components = extractComponentsV2(i, lines);
                if (components) {
                    PDF_DATA.COMPONENT.push(components);
                    PDF_DATA.IS_V2 = PDF_DATA.IS_V2 || components.IS_V2;
                }
            }
        } else if (MAIN_COMPONENTS.test(text.replace(/,/g, '').trim())) {
            const components = extractComponents(i, lines);
            if (components) {
                PDF_DATA.COMPONENT.push(components);
            }
        }
    }
    return PDF_DATA;
}

const tabulaHandler = (cmd, filename) => {
    return new Promise((resolve, reject) => {
        const cmds = {
            turbine: `java -Dfile.encoding=utf-8 -Xms256M -Xmx1024M -jar "${config.TAPULA_PATH}" --pages all -c 10000 "${filename}"`,
            component: `java -Dfile.encoding=utf-8 -Xms256M -Xmx1024M -jar "${config.TAPULA_PATH}" --pages all --columns 200,320,442,1000 "${filename}"`
        };
        exec(cmds[cmd], (err, stdout, stderr) => {
            if (err) {
              return reject(err);
            }
            return resolve(getPdfData(cmd == 'turbine', filename, stdout));
        });
    });
}

const main = async () => {
    const EXTENSION = /(\.pdf)$/i;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.match(EXTENSION)) {
            console.log(`****** ${file} ******`);
            const data =  await tabulaHandler('turbine', getPath(file));
            if (!data.IS_V2) {
                const data2 = await tabulaHandler('component', getPath(file));
                data.COMPONENT = data2.COMPONENT;
            }
            if (data.IS_SCAN) {
                console.log(`${file}: FORMAT NON RECONNU`);
            } else {
                await dataWriter.save(data);
            }
        }
        setTimeout(() => {
            //
        }, 2000);
    }
}

main().then(() => {
    console.log('-----END-----');
}).catch(err => {
    console.log('------ CAN NOT EXECUTE THE TRAITEMENT -------');
    console.log('------ REASON: ', err);
});