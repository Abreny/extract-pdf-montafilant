# How to run the project
First:

    git clone https://gitlab.com/Abned/extract-pdf-montafilant.git
    cd extract-pdf-montafilant
    npm install --save

Next, put the pdfs into **pdfs**. And you must configure the config for the database in **src/app/config.js**.

Finally, do these:

    npm run rename-file
    npm run init-xls
    npm run app