import SQLite from 'react-native-sqlite-storage';
import {Platform} from 'react-native'
import Utils from './Utils';

const moment = require('moment');
const RNFS = require('react-native-fs');


SQLite.DEBUG(true)
SQLite.enablePromise(true)
let connection

async function init() {
    let iosConfig = { name: 'timelogdb', createFromLocation: '~www/timelogdb.db', location: 'Library' }
    let androidConfig = { name: 'timelogdb', createFromLocation: '~timelogdb.db' }
    try {
        connection = await SQLite.openDatabase(Platform.OS === 'ios' ? iosConfig : androidConfig)
    } catch(err) {
        console.log('DATABASE ERROR ====>>>> ', err)
    }
}

init()

class SQLDatabase {

    run = (sql, params, isBackUp = true) => {
        return new Promise( (res, rej) => {

            params = params ? params : []

            connection.transaction( tx => {
                tx.executeSql(sql, params)
                .then( result => {

                    if (!sql.includes('select') && isBackUp) {

                        saveItToFileForRestoring({sql, params})

                    }

                    res(result[1])
                })
            }).catch( err => rej(err.message))
        } ) 
    }

    // close = () => {
    //     return new Promise( (res, rej) => {
    //         this.db.close().then((status) => {
    //             res(status)
    //         }).catch((err) => {
    //             rej(err)
    //         });
    //     })
    // }

}

export default new SQLDatabase()

/*
    basically save file to the internal storage inside a folder called timelog
    read the content from there
    and add new stuff to the file while in memory and then save it in
    again to the file

    interms of file it will be an array or objects each with an sql code
 */
function saveItToFileForRestoring(obj) {

    if (Platform.OS === 'android') {
        
        Utils.storage.get('APP_CONFIGURED', true).then( async configured => {

            if (configured) {

                let backupFile = `${RNFS.ExternalStorageDirectoryPath}/TimeLogs/backup.json`
                let backup = JSON.parse( await RNFS.readFile(backupFile) )
                // let backup = { data: [] }
                backup.data.push({
                    ...obj,
                    time: moment().toISOString()
                })
                console.log('here it is the file for backup =====+++++++', backup)
                    
                // await Utils.sleep(2)
                RNFS.writeFile(backupFile, JSON.stringify(backup))

            }

        })


    } else if (Platform.OS === 'ios') {

    }
}
