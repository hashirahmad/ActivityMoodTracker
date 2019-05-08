import React from 'react'
import {Alert, Platform, StatusBar, StyleSheet, View} from 'react-native'
import gstyles from '../components/styles'
import {showMessage} from 'react-native-flash-message'
import db from '../logic/db'
import Utils from '../logic/Utils';
import Spinner from 'react-native-loading-spinner-overlay';
import Snackbar from 'react-native-snackbar';
import {ProgressCircle} from 'react-native-svg-charts'
import themes from '../components/theme';
import { Text } from 'react-native-paper';
import invert from 'invert-color';

const Stopwatch = require('statman-stopwatch');
const sw = new Stopwatch()
const moment = require('moment');
const PushNotification = require('react-native-push-notification');
const RNFS = require('react-native-fs')

export default class OneOffConfig extends React.Component {

    constructor() {
        super()
        this.state = {
            isLoading: false,
            progress: 0,
            progressColor: Utils.randomColors.random()
        }
    }

    exit = () => {
        this.props.navigation.goBack()
        this.props.navigation.navigate('Home')
    }

    restoreDB = async () => {

        Utils.storage.get('APP_CONFIGURED', true).then(async configured => {
            if (configured) {

                let backupFile = `${RNFS.ExternalStorageDirectoryPath}/TimeLogs/backup.json`

                let backupData = JSON.parse( await RNFS.readFile(backupFile) )
                let counter = 0
                let failed = 0
                let restored = false
                // let lastBackUpTime

                if (backupData && backupData.data.length > 0) {
                    // console.log(backupData)
                    // lastBackUpTime = moment(backupData.lastBackUpTime)

                    for (s in backupData.data) {
                        let sqlLine = backupData.data[s]
                        try {

                            await db.run(sqlLine.sql, sqlLine.params, false)

                        } catch (err) {

                            console.log(`This sql line failed: ${sqlLine.sql} with ${sqlLine.params} Failed so far: ${++failed}`)

                        }
                        counter++
                        this.setState({ progress: counter / backupData.data.length })
                        console.log('Executed:', sqlLine, counter / backupData.data.length)
                    }

                    Snackbar.show({
                        title: `Restored successfully. ${backupData.data.length} records have been restored.`,
                        duration: Snackbar.LENGTH_LONG
                    })
                } else Snackbar.show({
                    title: `There was backup file but contains no data to import`,
                    duration: Snackbar.LENGTH_LONG
                })
                this.exit()
            }
        }).catch(err => {
            showMessage({
                message: `An backup/restore error happened: ${err}`,
                type: 'danger',
                autoHide: false,
            })
        })

    }

    componentDidMount = async () => {
        Utils.orientation.portraitOnly()
        if (Platform.OS === 'android') {

            let access = await this.getWiteReadPermissions()
            if (access) {
                // Alert.alert('Ok I have passed into this stuff')
                Utils.storage.save('READ_WRITE_GRANTED', true)

                let path = RNFS.ExternalStorageDirectoryPath + '/TimeLogs'
                let backup = path + '/backup.json'
                let autoRestore = false

                let isThereAnyBackup = await RNFS.exists(backup)
                // Alert.alert(`Ok so folder exists status: ${isThereAnyBackup}`)
                if (!isThereAnyBackup) {
                    let backupData = JSON.stringify({
                        data: [],
                        lastBackUpTime: moment().toISOString()
                        // applicationInstalledTime: 
                    })
                    await RNFS.mkdir(path)
                    console.log('created a folder')
                    // Alert.alert(`Created a folder: `)
                    await RNFS.writeFile(backup, backupData)

                } else {
                    autoRestore = true
                    // Alert.alert(`ok so there is data to restored: ${autoRestore}`)
                }
                await Utils.storage.save('APP_CONFIGURED', true)

                if (autoRestore) {
                    Alert.alert(
                        'Auto restore?',
                        'You have previous data saved up. Would you like to restore it now?',
                        [
                          {text: 'Yes, please restore', onPress: () => this.restoreDB()},
                          {text: 'No, dont restore', onPress: () => this.exit()},
                        ],
                        {cancelable: false},
                      );
                } else this.exit()
                // Alert.alert(`got up to here. it should be done. ${await Utils.storage.get('APP_CONFIGURED', true)}`)
                
                // console.log(backup, 'path')
                // RNFS.readFile(backup).then(file => {
                //     console.log(JSON.parse(file), 'here it is after creation')
                // })

            } else showMessage({
                message: 'No permissions are not fulled granted',
                type: 'warning',
                autoHide: false
            })

        } else this.exit()
    }

    getWiteReadPermissions = async () => {
        let access = await Utils.checkPermissions()
        console.log('acess inside', access)
        while (!(access.read && access.write)) {
            access = await Utils.checkPermissions()
        }
        return true
        // if (!access.read || !access.write) await this.getWiteReadPermissions() 
        // return true
    }

    render() {

        return (
            <View style={{...gstyles.MAIN_VIEW, backgroundColor: themes[themes.current].colors.background }}>
                <StatusBar backgroundColor={themes[themes.current].colors.background} />
                <Spinner
                    visible={this.state.isLoading}
                    textContent={'Loading...'}
                    textStyle={{ color: invert(themes[themes.current].colors.background) }}
                    color={progressColor}
                    cancelable={true}
                    animation='fade'
                    size='large'
                />
                <View style={{...gstyles.CENTER,}}>
                    <Text>
                        Configurating your app for one off needs...
                    </Text>
                </View>
                <View style={{ display: this.state.progress > 0 ? 'flex' : 'none' }}>
                    <ProgressCircle
                            style={ { height: 200 } }
                            animate={true}
                            progress={ this.state.progress }
                            progressColor={this.state.progressColor}
                        />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    activitiesControls: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignSelf: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 50,
    }
})