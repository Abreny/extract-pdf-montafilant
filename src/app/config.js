const path = require('path');
module.exports = {
    PDF_DIRS: {
        DEFAULT: path.resolve(__dirname, '../../pdfs'),
    },
    MYSQL: {
        host     : 'localhost',
        user: "otwoodev",
        password: "$IO@twoo2019",
        database: "extract_pdf_montafilant"
    }
}