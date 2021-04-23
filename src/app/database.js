
const dropTable = async (conn) => {
    const tables = [
        'electricite_referentiel',
        'electricite'
    ]
    const funcDropTable = (tblname) => {
        return new Promise((resolve, reject) => {
            const sql = `DROP TABLE IF EXISTS ${tblname}`;
            conn.query(sql, (err, result) => {
                if (err) {
                    console.log(`-- FAILED TO DROP TABLE ${tblname} --`);
                    reject(err);
                    return;
                }
                console.log(`-- ${tblname} dropped! --`);
                resolve(result);
            });
        })
    }
    for(let i = 0; i < tables.length; i++) {
        await funcDropTable(tables[i]);   
    }
}
const createTable = async (conn) => {
    const tables = {
        'electricite_referentiel': `
            CREATE TABLE electricite_referentiel (
                FILENAME varchar(255) primary key,
                RAE_INFO varchar(255),
                RAISON_SOCIALE varchar(255),
                SIRET varchar(255),
                CODE_APE varchar(255),
                ADRESSE_FACT varchar(255),
                CODE_POSTALE_FACT varchar(255),
                VILLE_FACT varchar(255),
                FOURNISSEUR varchar(255),
                NOM_DU_SITE varchar(255),
                RAE varchar(255),
                TARIF_TURPE varchar(255),
                SEGMENT varchar(255),
                DEBUT_LIVRAISON varchar(255),
                FIN_LIVRAISON varchar(255),
                ADRESSE varchar(255),
                CODE_POSTAL varchar(255),
                VILLE varchar(255),
                PS_P varchar(255),
                PS_HPH varchar(255),
                PS_HCH varchar(255),
                PS_HPE varchar(255),
                PS_HCE varchar(255),
                PS_CONCAT varchar(255),
                CONSOMMATION_PH varchar(255),
                CONSOMMATION_HPH varchar(255),
                CONSOMMATION_HCH varchar(255),
                CONSOMMATION_HPE varchar(255),
                CONSOMMATION_HCE varchar(255),
                CONSOMMATION_TOTALE varchar(255),
                DEPT_CODE varchar(255),
                ABONNEMENT varchar(255),
                PRIX_HP varchar(255),
                PRIX_HPH varchar(255),
                PRIX_HCH varchar(255),
                PRIX_HPE varchar(255),
                PRIX_HCE varchar(255),
                CEE varchar(255),
                CAPACITE varchar(255),
                OPTION_C5 varchar(255),
                CONTRAT_CARD varchar(255),
                PRIX_ARENH varchar(255),
                TAUX_CSPE varchar(255),
                NUM_CLIENT varchar(255),
                NOM_CLIENT varchar(255)
            )
        `,
        'electricite': `
            CREATE TABLE electricite (
                FILENAME varchar(255) primary key,
                SIRET varchar(255),
                RAE varchar(255),
                PERIODE varchar(255),
                CONSO_HP varchar(255),
                CONSO_HPH varchar(255),
                CONSO_HPD varchar(255),
                CONSO_HCH varchar(255),
                CONSO_HCD varchar(255),
                CONSO_HPE varchar(255),
                CONSO_HCE varchar(255),
                CONSO_JA varchar(255),
                CONSO_TOTAL varchar(255),
                FACTURATION_HTVA varchar(255),
                PA_HP varchar(255),
                PA_HPH varchar(255),
                PA_HCH varchar(255),
                PA_HPE varchar(255),
                PA_HCE varchar(255),
                DEPASSEMENTS varchar(255),
                REACTIF varchar(255),
                DIVERS varchar(255),
                ABONNEMENT varchar(255),
                PRIX_HP varchar(255),
                PRIX_HPH varchar(255),
                PRIX_HCH varchar(255),
                PRIX_HPE varchar(255),
                PRIX_HCE varchar(255),
                CEE varchar(255),
                CAPACITE varchar(255),
                FOURNITURE varchar(255),
                ACHEMINEMENT varchar(255),
                TAXES varchar(255)
            )
        `
    }
    const funcCreateTable = (tblname, sql) => {
        return new Promise((resolve, reject) => {
            conn.query(sql, (err, result) => {
                if (err) {
                    console.log(`-- FAILED TO CREATE TABLE ${tblname} --`);
                    reject(err);
                    return;
                }
                console.log(`-- ${tblname} created! --`);
                resolve(result);
            });
        })
    }
    for(let tablename in tables) {
        await funcCreateTable(tablename, tables[tablename]);
    }
}

module.exports = {
    init: (conn) => {
        return Promise.all([
            dropTable(conn),
            createTable(conn)
        ]);
    },
    save: (connection, pdfData) => {
        console.log('PDF_DATA: ', JSON.stringify(pdfData, null, 2));
        const funcInsert = (conn, tblname, data) => {
            return new Promise((resolve, reject) => {
                conn.query(`INSERT INTO ${tblname} SET ?`, data, function (error, results, fields) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(results);
                });
            });
        }

        return Promise.all([
            funcInsert(connection, 'electricite_referentiel', pdfData.referentiel),
            funcInsert(connection, 'electricite', pdfData.electricite)
        ])
    }
}