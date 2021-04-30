const ExcelJS = require('exceljs');
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('duplicateTest');
ws.properties.defaultRowHeight = 35;
ws.getCell('A1').value = 'One';
ws.getCell('A2').value = 'Two';
ws.getCell('A3').value = 'Three';
ws.getCell('A4').value = 'Four';

wb.xlsx.writeFile('test.xlsx').then((data) => {
    console.log('**** EXCEL CREATED *****');
}).catch(e => {
    console.log('****** CAN NOT CREATE THE EXCEL *****');
    console.log('ERR: ', e);
})