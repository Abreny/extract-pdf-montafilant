const ExcelJS = require('exceljs');

const config = require('./config');

const wb = new ExcelJS.Workbook();

for (const sheet in config.EXCELS.SHEETS) {
    if (Object.hasOwnProperty.call(config.EXCELS.SHEETS, sheet)) {
        const ws = wb.addWorksheet(sheet);
        ws.properties.defaultRowHeight = 25;
        ws.addRow( config.EXCELS.SHEETS[sheet]);
    }
}

wb.xlsx.writeFile(config.EXCELS.FILENAME).then((data) => {
    console.log('**** EXCEL CREATED *****');
}).catch(e => {
    console.log('****** CAN NOT CREATE THE EXCEL *****');
    console.log('ERR: ', e);
})