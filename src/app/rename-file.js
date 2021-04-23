const fs = require('fs');
const path = require('path');

const config = require('./config');

const getDirs = () => {
    return config.PDF_DIRS.DEFAULT;
}

const getPath = (filename) => {
    return path.resolve(getDirs(), filename);
}

const slugify = (string) => {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
  
    return string.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word characters
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
}

fs.readdir(getDirs(), (err, files) => {
    if (err) {
        console.log('READ_PDF_DIR_ERROR', err);
        return;
    }

    const EXTENSION = /(\.pdf)$/i;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = path.extname(file);
        if (file.match(EXTENSION)) {
            const newFileName = `${slugify(path.basename(file, extension))}${extension}`;
            console.log(`****** ${newFileName} ******`);
            fs.rename(getPath(file), getPath(newFileName), (e) => {
                if ( err ) console.log('ERROR: ' + e);
            });
        }
    }
});
