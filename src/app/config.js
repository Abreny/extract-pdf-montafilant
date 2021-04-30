const path = require('path');
module.exports = {
    PDF_DIRS: {
        DEFAULT: path.resolve(__dirname, '../../pdfs'),
    },
    TAPULA_PATH: 'tabula-1.0.4.jar',
    EXCELS: {
        SHEETS: {
            'Turbine': ['N° De Serie', 'Nominal Power', 'Hub Height', 'Rotor Diameter', 'Site', 'Date of Commissioning', 'WTG-Type'],
            'Expertise': ['Reference Expertise', 'N° De Serie', 'Object', 'Scope', 'Report Name', 'Date of Expertise', 'Expert', 'Subcontractor', 'Contractor', 'Project Engineer', 'Customer', 'Maximum Power', 'Hours of operations', 'Produced Energy', 'Consumption'],
            'Component': ['Noun', 'Manufacturer', 'Type', 'SN/Number', 'Reference Expertise'],
            'Remark': ['Chapter', 'Criticity', 'Text', 'Comment', 'Reference Expertise'],
            'Conclusion': ['Title', 'Text', 'Comment', 'Reference Expertise']
        },
        TABLE: {TURBINE: 'Turbine', EXPERTISE: 'Expertise', COMPONENT: 'Component', REMARK: 'Remark', CONCLUSION: 'Conclusion'},
        FILENAME: 'exportation-result.xlsx'
    }
}