const pdf2html = require("pdf2html");

module.exports = {
    getHtml: (filename) => {
        return new Promise((resolve, reject) => {
            pdf2html.html(filename, (err, html) => {
                if (err) {
                    return reject(err)
                }
                resolve(html);
            })
        })
    },
    getText: (filename) => {
        return new Promise((resolve, reject) => {
            pdf2html.text(filename, (err, text) => {
                if (err) {
                    return reject(err)
                }
                return resolve(text)
            })
        })
    }
}