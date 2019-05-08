import React from 'react'
import {View} from 'react-native'
import gstyles from '../../components/styles'
import {showMessage} from 'react-native-flash-message'
import db from '../../logic/db'
import sql from '../../logic/sql'
import {Button,} from 'react-native-paper';
import {ProgressCircle} from 'react-native-svg-charts'
import Spinner from 'react-native-loading-spinner-overlay';
import Utils from '../../logic/Utils';
import Snackbar from 'react-native-snackbar';

const moment = require('moment');
const RNFS = require('react-native-fs');


export default class Backup extends React.Component {

    constructor() {
        super()
        this.state = {
            isLoading: false,
            activityWarningFeature: true,
            progress: 0
        }
    }

    componentDidMount = () => {
        let configState = {}
        db.run(sql.config).then( result => {
            result.rows.raw().forEach( config => {
                configState[config.key] = parseInt(config.value)
            })
            this.setState({ isLoading: false, ...configState })
        })
    }

    restoreDB = async () => {

        Utils.storage.get('APP_CONFIGURED', true).then(async configured => {
            if (configured) {

                let backupFile = `${RNFS.ExternalStorageDirectoryPath}/TimeLogs/backup.json`

                let backupData = JSON.parse( await RNFS.readFile(backupFile) )
                let counter = 0
                let failed = 0
                let restored = false
                let lastBackUpTime

                if (backupData && backupData.data.length > 0) {
                    console.log(backupData)
                    lastBackUpTime = moment(backupData.lastBackUpTime)

                    for (s in backupData.data) {
                        let sqlLine = backupData.data[s]
                        try {

                            let sqlTime = moment(sqlLine.time)

                            if (lastBackUpTime.isAfter(sqlTime)) {
                                await db.run(sqlLine.sql, sqlLine.params, false)
                                restored = true
                            }

                        } catch (err) {

                            console.log(`This sql line failed: ${sqlLine.sql} with ${sqlLine.params} Failed so far: ${++failed}`)

                        }
                        counter++
                        this.setState({ progress: counter / backupData.data.length * 100 })
                        console.log('Executed:', sqlLine)
                    }

                    backupData.lastBackUpTime = moment().toString()
                    await RNFS.writeFile(backupFile, JSON.stringify(backupData))
                    this.setState({ isLoading: false })
                    Snackbar.show({
                        title: restored ? `Restored successfully` : `Nothing to restore. All up to date.`, 
                        duration: Snackbar.LENGTH_LONG
                    })
                } else Snackbar.show({
                        title: `There is no data to restore.`,
                        duration: Snackbar.LENGTH_LONG
                })
            }
        }).catch(err => {
            showMessage({
                message: `An backup/restore error happened: ${err}`,
                type: 'danger',
                autoHide: false,
            })
        })

    }

    render() {
        return (
            <View style={{...gstyles.MAIN_VIEW, backgroundColor: themes[themes.current].colors.background }}>
                <Spinner
                    visible={this.state.isLoading}
                    textContent={'Loading...'}
                    textStyle={{ color: invert(themes[themes.current].colors.background) }}
                    color={Utils.randomColors.random()}
                    cancelable={true}
                    animation='fade'
                    size='large'
                />
                <View style={{...gstyles.HORIZONTAL_ROW, flex: 0.1}}>
                    <Button 
                        icon="save" 
                        mode="outlined"
                        style={{alignSelf: 'center', width: 150, borderRadius: 10}}
                        onPress={this.restoreDB}
                    >
                        Restore
                    </Button>
                </View>
                <View style={{ flex: 0.9}}>
                    <ProgressCircle
                        style={ { height: 200, display: this.state.progress > 0 ? 'flex' : 'none' } }
                        animate={true}
                        progress={ this.state.progress }
                        progressColor={Utils.randomColors.random()}
                    />
                </View>           
            </View>
        );
    }
}