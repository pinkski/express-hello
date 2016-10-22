/**
 * Created by zhu on 16/10/22.
 */
var settings = require('../settings'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;

module.exports = new Db(settings.db, new Server(settings.host, settings.port), {safe:true});
// new Db,设置了数据库名, 数据库地址， 数据库端口  并导出