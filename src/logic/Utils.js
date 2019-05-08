import {AsyncStorage, PermissionsAndroid} from 'react-native'
import Snackbar from 'react-native-snackbar';
import db from './db';
import sql from './sql';
import randomColor from 'randomcolor'
import Orientation from 'react-native-orientation';
import invert from 'invert-color';
import { showMessage } from 'react-native-flash-message';

const moment = require('moment');

const Utils = {

    isDuplicateOrEmpty: (value, array, key) => {
        return ( value === '' || array.find( obj => obj[key] === value ) !== undefined )
    },

    sleep: s => {
        return new Promise(resolve => setTimeout(resolve, s * 1000));
    },

    alert: {
        success: msg => {
            Utils.alert.show({ 
                message: msg, type: 'success', duration: 3000,
            })
        },
        i: msg => {
            Utils.alert.show({ 
                message: msg, type: 'info', autoHide: false,
            })
        },
        warn: msg => {
            Utils.alert.show({ 
                message: msg, type: 'warning', autoHide: false,
            })
        },
        err: msg => {
            Utils.alert.show({ 
                message: msg, type: 'danger', autoHide: false,
            })
        },
        show: obj => { 

            if (obj.autoHide) {
                obj.msg = obj.msg + '\n\n Tap here to close'
            }

            showMessage(obj)
        }
    },

    storage: {
        save: async (key, value, isJson) => {
            try {
                value = isJson ? JSON.stringify(value) : value.toString()
                await AsyncStorage.setItem(key, value);
            } catch (error) {
                console.log('Error occured while saving data with the key of ', key, value)
            }
        },
        get: (key, isJson) => {
            return new Promise( async (res, rej) => {
                try {
                    const value = await AsyncStorage.getItem(key);
                    if (value !== null) {
                        res( isJson ? JSON.parse(value) : value )
                    } else res( 'NO_KEY' )
                } catch (error) {
                    console.log('Error occured while getting the data with they key of ',key, error)
                    rej( error)
                }
            })
        },
        clear: () => AsyncStorage.clear(),
        remove: key => AsyncStorage.removeItem(key),
        getAllKeys: () => AsyncStorage.getAllKeys(),
    }, 
    dashboardTappingColor: 'rgba(0, 0, 0, 0.99)',
    randomColors: {
        light: () => randomColor({ luminosity: 'light' }),
        dark: () => randomColor({ luminosity: 'dark' }),
        random: () => randomColor(),
        bright: () => randomColor({ luminosity: 'bright' }),
        background: () => randomColor({ luminosity: 'dark', hue: 'monochrome' })
    },
    checkPermissions: async (showSuccessNotification) => {
        let granted = { read: false, write: false, err: null }
        try {
            granted.write = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)
            granted.read = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE)
            
            if (granted.read && granted.write) {
                if (showSuccessNotification) Snackbar.show({ title: `Permissions have been granted successfully`, duration: Snackbar.LENGTH_LONG })
            }
            else if (!granted.read) {
                // Snackbar.show({ title: `Read permission is not allowed`, duration: Snackbar.LENGTH_LONG })
                let read = await Utils.requestReadStoragePermission()
                granted.read = read.read
            } else if (!granted.write) {
                // Snackbar.show({ title: `Write permission is not allowed`, duration: Snackbar.LENGTH_LONG })
                let write = await Utils.requestWriteStoragePermission()
                granted.write = write.write
            } else { 
                Snackbar.show({ title: `None of the permissions are allowed so asking you now`, duration: Snackbar.LENGTH_LONG })
                let both = await Utils.requestReadWritePermission()
                granted.read = both['android.permission.READ_EXTERNAL_STORAGE'] === 'granted'
                granted.write = both['android.permission.WRITE_EXTERNAL_STORAGE'] === 'granted'
            }
        } catch (err) {
            console.log('An error happened while checking for permissions', err)
            granted.err = err
        }
        return granted
    },
    requestWriteStoragePermission: async () => {
        let granted = { write: false, err: null }
        try {
            const write = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'Write to your internal storage',
                    message: 'Required for automatic backup of data'
                }
            )
            granted.write = write === PermissionsAndroid.RESULTS.GRANTED
            // Utils.storage.get('readAccess', true).then( read => {
            //     if (read && granted.write) Utils.storage.save('readWriteAccess', true)
            //     else Utils.storage.save('writeAccess', granted.write)
            // })
            if (!granted.write) Snackbar.show({ title: `Write storage permission not granted`, duration: Snackbar.LENGTH_LONG  })
        } catch (err) {
            console.log('An error occured while requesting for wirte permissions', err)
            granted.err = err
        }
        return granted
    },
    requestReadStoragePermission: async () => {
        let granted = { read: false, err: null }
        try {
            const read = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                {
                    title: 'Read your internal storage',
                    message: 'Required for automatic backing up of data as well as for restoring it for later reasons'
                }
            )
            granted.read = read === PermissionsAndroid.RESULTS.GRANTED
            // Utils.storage.get('writeAccess', true).then( write => {
            //     if (write && granted.read) Utils.storage.save('readWriteAccess', true)
            //     else Utils.storage.save('readAccess', granted.read)
            // })
            if (!granted.read) Snackbar.show({ title: `Read storage permission not granted`, duration: Snackbar.LENGTH_LONG  })
        } catch (err) {
            console.log('An error occured while requesting for read storage permissions', err)
            granted.err = err
        }
        return granted
    },
    requestReadWritePermission: async () => {
        try {
            return await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            ],
                {
                    title: 'Read/Write to your internal storage',
                    message: 'Required for automatic backing up of data as well as for restoring it for later reasons'
                }
            )
        } catch (err) {
            console.log('An error occured while requesting for read/write permissions')
        }
    },
    colorBasedOnMood: mood => {
        switch(mood){
            case 'Joy': return 'rgb(2, 206, 117)'
            case 'Happy': return 'rgb(187, 244, 65)'
            case 'Neutral': return 'rgb(250, 255, 0)'
            case 'Sad': return 'rgb(226, 96, 15)'
            case 'Angry': return 'rgb(216, 24, 4)'
            default: return 'rgb(191, 191, 191)'
        }
    },
    applyMoodsToCalendarView: async (dates = {
        start: moment('2017-08-01').format('YYYY-MM-DD 00:00:00'),
        end: moment().endOf('month').format('YYYY-MM-DD 23:59:59')
    }) => {
        return new Promise((res, rej) => {
            // this.setState({ isLoading: true })
            db.run( sql.timelineMoodBased.join(' '), [ dates.start, dates.end, dates.start, dates.end ]).then( result => {
                let stats = result.rows.raw()
                let markedDates = {}
                if ( stats.length > 0 ) {
                    let state
                    stats.forEach( (day, i) => {
                        let previousDay = i === 0 ? stats[i] : stats[i-1]
    
                        if (i === 0) {
                            markedDates = {
                                ...markedDates,
                                [day.day]: { startingDay: true, color: Utils.colorBasedOnMood(day.moodName) }
                            }
                            state = "startday"
                        } else {
    
                            if (previousDay.moodName === day.moodName) {
                                markedDates = {
                                    ...markedDates,
                                    [day.day]: { color: Utils.colorBasedOnMood(day.moodName)}
                                }
                                state = "loop"
                            } else {
    
                                if (state === "startday" || state === "loop") {
                                    markedDates = {
                                        ...markedDates,
                                        [day.day]: { startingDay: true, color: Utils.colorBasedOnMood(day.moodName) }
                                    }
                                } else {
                                    markedDates = {
                                        ...markedDates,
                                        [day.day]: { endingDay: true, color: Utils.colorBasedOnMood(day.moodName) }
                                    }
                                    state = "endday"
                                }
    
                            }
                        }
    
                        // markedDates = {
                        //     ...markedDates,
                        //     // [day.day]: { startingDay: true, color: Utils.colorBasedOnMood(day.moodName) }
                        //     [day.day]: { selected: true, selectedColor: Utils.colorBasedOnMood(day.moodName), marked: true }
                        // }
                    })
                    console.log(markedDates)
                    // this.setState({ markedDates, markedDatesUntouched: Object.assign({}, markedDates), isLoading: false })
                }
                res({ markedDates, markedDatesUntouched: Object.assign({}, markedDates) })
            })
        })
    },
    orientation: {
        portraitOnly: () => {
            // Orientation.addOrientationListener( state => {
            //     if (state !== 'PORTRAIT') {
            //         // Orientation.lockToPortrait()
            //         showMessage({
            //             message: `Currently only portrait mode is supported except Dashboard screen.`,
            //             type: 'info'
            //         })
            //     }
            // })
            Orientation.lockToPortrait()
        },
        allowBoth: () => {
            Orientation.unlockAllOrientations()
        }
    }
}

export default Utils