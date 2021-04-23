const database = require('./database');

module.exports = async (conn) => {
    await database.init(conn);
}