const ExcelJS = require('exceljs');

const config = require('./config');

const wb = new ExcelJS.Workbook();

const saveTurbine = (data) => {
    const ws = wb.getWorksheet(config.EXCELS.TABLE.TURBINE);
    ws.addRow([
        data.INFO_TURBINE.NUM_SERIE,
        data.PRODUCTION_DATA.MINIMAL_POWER,
        data.PRODUCTION_DATA.HUB_HEIGHT,
        data.PRODUCTION_DATA.ROTOR_DIAMETER,
        data.INFO_TURBINE.SITE,
        data.PRODUCTION_DATA.DATE_COMMISSIONING,
        data.INFO_TURBINE.WTG_TYPE ? data.INFO_TURBINE.WTG_TYPE : data.INFO_TURBINE.MACHINE_TYPE
    ]);
};

const saveExpertise = (data) => {
    const ws = wb.getWorksheet(config.EXCELS.TABLE.EXPERTISE);
    ws.addRow([
        data.INFO_TURBINE.REFERENCE,
        data.INFO_TURBINE.NUM_SERIE,
        data.INFO_TURBINE.OBJECT,
        data.INFO_TURBINE.SCOPE,
        data.INFO_TURBINE.REPORT_NAME,
        data.INFO_TURBINE.DATE_OF_EXPERTISE,
        data.INFO_TURBINE.EXPERT,
        data.INFO_TURBINE.SUBCONTRACTOR,
        data.INFO_TURBINE.CONTRACTOR,
        data.INFO_TURBINE.PROJECT_ENGINEER,
        data.INFO_TURBINE.CUSTOMER,
        data.PRODUCTION_DATA.MAX_POWER,
        data.PRODUCTION_DATA.HOUR_OPERATION,
        data.PRODUCTION_DATA.ENERGY_PRODUCTION,
        data.PRODUCTION_DATA.CONSUMPTION
    ]);
};

const saveComponent = (data) => {
    const ws = wb.getWorksheet(config.EXCELS.TABLE.COMPONENT);
    const componentData = data.COMPONENT;
    for(let i = 0; i < componentData.length; i++) {
        const elems = componentData[i];
        for(const rows of elems.DATA) {
            ws.addRow([
                rows[0],
                rows[1],
                rows[2],
                rows[3],
                data.INFO_TURBINE.REFERENCE
            ]);
        }
    }
};

const saveRemark = (data) => {
    const ws = wb.getWorksheet(config.EXCELS.TABLE.REMARK);
    const remarkData = data.EXPERTISE_DETAILS;
    for(let i = 0; i < remarkData.length; i++) {
        const elems = remarkData[i];
        for(const rows of elems.DATA) {
            ws.addRow([
                elems.TITLE,
                rows.CRITICITY,
                rows.TEXT,
                '',
                data.INFO_TURBINE.REFERENCE
            ]);
        }
    }
};

const saveConclusion = (data) => {
    const ws = wb.getWorksheet(config.EXCELS.TABLE.CONCLUSION);
    const remarkData = data.CONCLUSION;
    for(let i = 0; i < remarkData.length; i++) {
        const elems = remarkData[i];
        for(const rows of elems.DATA) {
            ws.addRow([
                rows.TITLE,
                rows.TEXT,
                rows.COMMENT,
                data.INFO_TURBINE.REFERENCE
            ]);
        }
    }
};


module.exports = {
    save: async function(data) {
        await wb.xlsx.readFile(config.EXCELS.FILENAME);
        saveTurbine(data);
        saveExpertise(data);
        saveComponent(data);
        saveRemark(data);
        saveConclusion(data);
        await wb.xlsx.writeFile(config.EXCELS.FILENAME, {
            encoding: 'UTF-8'
        });
    }
}