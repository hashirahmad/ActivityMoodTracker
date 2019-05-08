import React from 'react'
import {
    BackHandler,
    FlatList,
    Platform,
    PushNotificationIOS,
    ScrollView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native'
import gstyles from '../components/styles'
import {showMessage} from 'react-native-flash-message'
import db from '../logic/db'
import sql from '../logic/sql'
import {Caption, Dialog, FAB, IconButton, List, Portal, Text, TextInput, TouchableRipple,} from 'react-native-paper';
import AppStateListener from "react-native-appstate-listener";
import Emoji from 'react-native-emoji';
import Utils from '../logic/Utils';
import Spinner from 'react-native-loading-spinner-overlay';
import {NavigationActions} from 'react-navigation'
import themes from '../components/theme';
import invert from 'invert-color';

const Stopwatch = require('statman-stopwatch');
const sw = new Stopwatch()
const moment = require('moment');
const PushNotification = require('react-native-push-notification');


PushNotification.configure({

    // (optional) Called when Token is generated (iOS and Android)
    onRegister: function(token) {
        console.log( 'TOKEN:', token );
    },

    // (required) Called when a remote or local notification is opened or received
    onNotification: function(notification) {
        console.log( 'NOTIFICATION:', notification );

        // process the notification

        // required on iOS only (see fetchCompletionHandler docs: https://facebook.github.io/react-native/docs/pushnotificationios.html)
        notification.finish(PushNotificationIOS.FetchResult.NoData);
    },

    // // ANDROID ONLY: GCM or FCM Sender ID (product_number) (optional - not required for local notifications, but is need to receive remote push notifications)
    // senderID: "YOUR GCM (OR FCM) SENDER ID",

    // IOS ONLY (optional): default: all - Permissions to register.
    permissions: {
        alert: true,
        badge: true,
        sound: true
    },

    // Should the initial notification be popped automatically
    // default: true
    popInitialNotification: true,

    /**
      * (optional) default: true
      * - Specified if permissions (ios) and token (android and ios) will requested or not,
      * - if not, you must call PushNotificationsHandler.requestPermissions() later
      */
    requestPermissions: true,
});

export default class Home extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            activityFormattedDuration: '00:00:00',
            activityDuration: 0,
            startedActivity: false,
            notAllowDecrementation: true,
            showMoodSelectorDialog: false,
            showNotesDialog: false,
            notes: '',
            moodId: 6,
            isLoading: true,
            comeBackAppTime: moment(),
            leftAppTime: moment(),
            randomColor: Utils.randomColors.random()
        }
        this.startActivity = new Array()
        this.startActivityClearIntervals = new Array
        this.appConfigured = true
    }

    listActivities = ({item}) => (
        <List.Item
            style={gstyles.LIST_ITEM}
            title={item.activityName}
            onPress={() => this.startTimer(item)}
            left={props => <List.Icon {...props} icon='play-arrow' />}
            right={() => <IconButton 
                            icon='edit'
                            onPress={() => this.props.navigation.navigate('CreateEditActivity', { 
                                activity: item,
                                title: `Edit ${item.activityName}`
                            })}
                         />
            }
        />
    )

    activityTimer = () => {
        let duration = moment.duration( this.getDuration() )
        this.handleTimeDecrementation()
        let time = this.formattedTime(duration)
        this.setState({ activityFormattedDuration: time, activityDuration: duration._milliseconds })
    }

    pastActivityWarning = (activity) => {
        let date = moment()
        let month = date.format('MMMM')
        let finalMessage
        params = [
            activity.activityId,
            date.get('year'),
            this.pad( date.get('month') + 1 ).toString(), // because it returns month from 0  to 11
            this.pad( date.get('hour') ).toString(),
        ]
        db.run(sql.pastActivityWarning.join(' '), params).then( result => {
            let data = result.rows.raw()
            console.log(data, 'activity warning')
            if (data.length > 0) {
                sad = data.filter(obj => obj.moodName === 'Sad')[0]
                angry = data.filter(obj => obj.moodName == 'Angry')[0]

                if (sad) {
                    finalMessage = `In ${"March"} you have had ${sad.logCount + ' ' + sad.moodName} logs at around this hour of the day. `
                    finalMessage += `Please consider doing another activity right now`
                }

                if (angry) {
                    finalMessage = `In ${"March"} you have had ${angry.logCount + ' ' + angry.moodName} logs at around this hour of the day. `
                    finalMessage += `Please consider doing another activity right now`
                }

                if (sad && angry) {
                    finalMessage = `In ${"March"} you have had ${sad.logCount + ' ' + sad.moodName} and ${angry.logCount + ' ' + angry.moodName} logs `
                    finalMessage += `at around this hour of the day. Please consider doing another activity right now`
                }

                if (sad || angry) {
                    showMessage({
                        message: finalMessage,
                        type: sad && angry ? 'danger' : 'warning',
                        autoHide: false
                    })
                }                
            }
        })
    }

    habitWarningEncouraging = (activity) => {
        console.log(activity)
        let userNotWarnedToday = activity.habitWarningLastTime ? moment(activity.habitActivityWarning).isBefore(moment().subtract(1,'d')) : true
        let habitAverageLengthMins = moment.duration(activity.habitAverageLength).asMinutes()
        // console.log(userNotWarnedToday, ' today or not today')
        if ((activity.habitType === 'GOOD' || activity.habitType === 'BAD') && userNotWarnedToday) {
            let finalMessage
            let lookBackDate = moment().subtract(activity.habitAverageLookBackMonths, 'months')
            params = [
                lookBackDate.format('YYYY-MM-DD 00:00:00'),
                moment().format('YYYY-MM-DD 23:59:59'),
                activity.activityId
            ]
            db.run(sql.habitActivityWarning.join(' '), params).then(result => {
                let stats = result.rows.raw()
                if (stats[0]) {
                    stats = stats[0]

                    let time = moment.utc( moment.duration( stats.avgMins * 60000 ).as('milliseconds') ).format('HH:mm:ss')

                    if (stats.avgMins < habitAverageLengthMins) {
                        finalMessage = `Your have been doing ${activity.activityName} on average for ${time} `
                        finalMessage += `from ${lookBackDate.format('DD/MM/YY')} til now `
                        if (activity.habitType === 'GOOD') {
                            finalMessage += `\nPlease do it for an extra ${activity.habitIncDecByMins} mins`
                            finalMessage += `\nYou can do it. Its a small change.`
                        } else {
                            finalMessage += `\nPlease cut your ${activity.activityName} by ${activity.habitIncDecByMins} mins`
                            finalMessage += `\nYou can cut this down by ${activity.habitIncDecByMins} mins. Give it a try!`
                        }
                        finalMessage += `\n\nIf its too much please adjust it by editing ${activity.activityName} from Home screen or turn this feature off completley`
                        
                        showMessage({
                            message: finalMessage,
                            type: activity.habitType === 'GOOD' ? 'success' : 'danger',
                            autoHide: false
                        })

                        db.run(sql.updateHabitWarningLastTime, [ moment().format('YYYY/MM/DD HH:mm:ss'), activity.activityId ]).catch( err => {
                            showMessage({
                                message: `Failed to update last warning time for the habit encouraging feature. here is the error: \n ${err}`,
                                type: 'warning',
                                autoHide: false
                            })
                        })
                    } 
                } else console.log('No data from SQL for habit warning was found', stats)
            })
        } else {
            console.log('habit warning and encouraging didnt happen', activity.habitType)
        }
    }

    startTimer = activity => {
        if (this.state.startedActivity === false) { 

            sw.start()
            this.pastActivityWarning(activity)
            this.habitWarningEncouraging(activity)
            this.setState({ startedActivity: true, activity: activity })
            // It is in arrray because through out testing there has been times when a function gets called
            // twice for unknown reason which results into more than one setintervls causing seconds to update quicker
            // than normal rate
            if (this.startActivity.length === 0) this.startActivity.push( setInterval(this.activityTimer, 1000) )

            PushNotification.localNotificationSchedule({
                title: "Consider taking small break of 10-20 minutes", // (optional)
                message: `Our brains hit peak performance at 90 to 120 minutes. Its has been 2 hours since you started "${activity.activityName}." Please take a small break of 10 to 20 minutes before getting back to work`, // (required)
                date: moment().add(2, 'hours').toDate()
            });
        } else {
            showMessage({
                message: `${activity.activityName} cannot be started. \n\nThere is an existing activity running. \nPlease save it before starting ${activity.activityName}`,
                type: 'info'
            })
        }
    }

    incrementTimer = n => {
        let duration = moment.duration( this.state.activityDuration + ( n * 60 * 1000 ) )
        console.log(duration, ' duration')
        this.setState({ 
            activityFormattedDuration: this.formattedTime(duration),
            activityDuration: duration._milliseconds,
            notAllowDecrementation: duration < ( 1000 * 60 )
        })
    }

    getDuration = () => {
        return this.state.activityDuration !== 0 ? this.state.activityDuration + 1000 : sw.read()
    }

    formattedTime = duration => {
        return `${this.pad( duration.hours() )}:${this.pad( duration.minutes() )}:${this.pad( duration.seconds() )}`
    }

    pad = n => {
        return n < 10 ? '0' + n : n;
    }

    forFirstTimeUse = () => (
        <View>
            <Text>
                There are no activities made by you yet so please create one.
            </Text>
        </View>
    )

    handleTimeDecrementation = () => {
        let duration = this.state.activityDuration
        this.setState({ notAllowDecrementation: duration < ( 1000 * 60 ) })
    }

    saveActivityLog = () => {
        let activityLogSQL = `insert into Log(logStartTime, logEndTime, logNote, moodId, activityId, duration) values	(?, ?, ?, ?, ?, ?)`
        let logEndTime = moment()
        let logStartTime = moment().subtract( moment.duration( this.state.activityDuration ) )
        let activityLogSQLValues = [
            logStartTime.format("YYYY-MM-DD HH:mm:ss"),
            logEndTime.format("YYYY-MM-DD HH:mm:ss"),
            this.state.notes,
            this.state.moodId,
            this.state.activity.activityId,
            this.state.activityDuration
        ]
        db.run(activityLogSQL, activityLogSQLValues).then( result => {
            if (result.rowsAffected === 1) {
                sw.reset()
                this.startActivity.forEach( interval => this.startActivityClearIntervals.push( clearInterval(interval) ) )
                this.startActivity = new Array()
                PushNotification.cancelAllLocalNotifications()
                this.setState({ 
                    activityFormattedDuration: '00:00:00', 
                    activityDuration: 0,
                    startedActivity: false,
                    notes: '',
                    moodId: null
                })
                Utils.storage.save('HOME_STATE', this.state, true)
                showMessage({
                    message: `${this.state.activity.activityName} log has been successfully saved`,
                    type: 'success'
                })
            }
        }).catch( err => {
            showMessage({
                message: `${this.state.activity.activityName} log has not been saved successfully. Error is: ${err}`,
                type: 'warning'
            })
        })
    }

    renderWhenTheirIsActivityRunning = () => (
        <View>
            <View style={{marginBottom: 10}}>
                <View style={{...gstyles.HORIZONTAL_ROW, marginBottom: -15}}>
                    <Caption style={{ fontWeight: 'bold',}}>Running </Caption>
                    <Caption style={{ fontSize: 20, }}>{this.state.activity ? this.state.activity.activityName : ''}</Caption>
                </View>
                <Text style={{fontSize: 50, ...gstyles.CENTER }}>{this.state.activityFormattedDuration}</Text>
                <Caption style={{ marginTop: -10, marginBottom: -10, ...gstyles.CENTER }}>
                    <Caption style={{ fontWeight: 'bold', }}>Since </Caption>
                    <Caption>
                        {
                            moment().subtract( moment.duration(this.state.activityDuration) ).format('HH:mm:ss')
                        }
                    </Caption>
                </Caption>
            </View>
            <View style={gstyles.HORIZONTAL_ROW}>
                <FAB
                    small
                    style={{ backgroundColor: this.state.randomColor}}
                    icon="stop"
                    onPress={() => this.saveActivityLog()}
                />
                <FAB
                    small
                    style={{ backgroundColor: this.state.randomColor}}
                    icon="insert-emoticon"
                    onPress={() => this.setState({ showMoodSelectorDialog: true })}
                />
                <FAB
                    small
                    style={{ backgroundColor: this.state.randomColor}}
                    icon="note-add"
                    onPress={() => this.setState({ showNotesDialog: true })}
                />
                <FAB
                    small
                    style={{ backgroundColor: this.state.randomColor}}
                    icon="exposure-neg-1"
                    disabled={this.state.notAllowDecrementation}
                    onPress={() => this.incrementTimer(-1)}
                />
                <FAB
                    small
                    style={{ backgroundColor: this.state.randomColor}}
                    icon="exposure-plus-1"
                    disabled={false}
                    onPress={() => this.incrementTimer(1)}
                />
            </View>
        </View>
    )

    renderWhenTheirIsNoActivityRunning = () => (
        <View>
            <Text>Start an activity by tapping on one of the activities</Text>
        </View>
    )

    renderEmojiMoods = ({item}) => (
        <TouchableRipple rippleColor="rgba(0, 0, 0, .32)">
            <Emoji 
                name={item.moodEmoji} 
                style={styles.emoji} 
                onPress={() => {
                    this.setState({ moodId: item.moodId, showMoodSelectorDialog: false })
                }}
            />
        </TouchableRipple>
    )

    renderMoods = () => (
        <Portal>
            <Dialog 
                visible={this.state.showMoodSelectorDialog}
                onDismiss={() => this.setState({ showMoodSelectorDialog: false })}
            >
                <Dialog.Title>Pick an emoji that best suits your current mood</Dialog.Title>
                <Dialog.Content>
                    <View style={{marginBottom: 20}}>
                        <FlatList 
                            data={this.state.moods}
                            renderItem={this.renderEmojiMoods}
                            contentContainerStyle={gstyles.HORIZONTAL_ROW}
                        />
                    </View>
                </Dialog.Content>
            </Dialog>
        </Portal>
    )

    renderNotesDialog = () => (
        <Portal>
            <Dialog 
                visible={this.state.showNotesDialog}
                onDismiss={() => this.setState({ showNotesDialog: false })}
            >
                <Dialog.Content style={{ height: 250}}>
                    <ScrollView style={{marginBottom: 20}}>
                        <TextInput
                            label='Add any notes'
                            value={this.state.notes}
                            multiline={true}
                            style={{height: 250, }}
                            onChangeText={ val => this.setState({ notes: val }) }
                        />
                    </ScrollView>
                </Dialog.Content>
            </Dialog>
        </Portal>
    )

    componentDidMount = async () => {
        if (Platform.OS === 'android') { await Utils.sleep(0.3) }
        Utils.orientation.portraitOnly()
        this.setState({ isLoading: true })
        db.run(sql.activities.join(' ')).then( result => {
            this.setState({activities: result.rows.raw()})
            db.run(sql.moods).then( result2 => {
                this.setState({ isLoading: false, moods: result2.rows.raw()})
            })
        })

        this.appConfigured = await Utils.storage.get('APP_CONFIGURED', true)
        if (this.appConfigured === 'NO_KEY' || !this.appConfigured) {
            this.props.navigation.navigate('More', {}, NavigationActions.navigate({ routeName: 'OneOffConfig' }))
        }
        

        this.props.navigation.addListener('willFocus', () => {
            Utils.orientation.portraitOnly()
            // console.log(this.state, 'here it is after relaunch')
            this.setState({ isLoading: true })
            db.run(sql.activities.join(' ')).then( result => {
                this.setState({activities: result.rows.raw()})
                db.run(sql.moods).then( result2 => {
                    this.setState({ isLoading: false, moods: result2.rows.raw()})
                })
            })
        });
        BackHandler.addEventListener('hardwareBackPress', this.handleBackground)
    }

    handleActive = () => {
        this.setState({isLoading: true})
        Utils.storage.get('HOME_STATE', true).then( result => {

            if (result !== 'NO_KEY') {

                this.setState({...result, randomColor: Utils.randomColors.random(), isLoading: false})
                // showMessage({message: `successfully got the item from previous state`, type: 'success'})
                // console.log('activity get', result)
                this.setState({ comeBackAppTime: moment() })
                // console.log("The application is now active!", this.state.comeBackAppTime);
                backgroundDuration = this.state.comeBackAppTime.diff(this.state.leftAppTime)
                if (this.state.startedActivity) {
                    // console.log('When starting after resume', sw.state(), this.startActivity)
                    if (sw.state() !== sw.STATES.RUNNING) sw.start()
                    if (this.startActivity.length === 0) this.startActivity.push( setInterval(this.activityTimer, 1000) )
                    let duration = moment.duration( this.getDuration() + backgroundDuration )
                    let time = this.formattedTime(duration)
                    // console.log('When starting after resume', sw.state(), this.startActivity)
                    this.setState({ activityFormattedDuration: time, activityDuration: duration._milliseconds })
                }
            } else {
                // showMessage({
                //     message: `There was no previous saved satate. So starting from scratch`,
                //     type: 'info'
                // })
            }

        }).catch( err => {
            showMessage({
                message: `There was error while getting the state of the app when you left. Here is the error: ${err}`,
                type: 'danger',
                autoHide: false
            })
            console.log('An error occured....', err)
        })
    }
       
    handleBackground = () => {
        this.setState({ leftAppTime: moment() })
        if (this.state.startedActivity) {
            sw.reset()
            console.log('Just before leaving', this.startActivity, sw.state())
            this.startActivity.forEach( interval => this.startActivityClearIntervals.push( clearInterval(interval) ) )
            console.log('After cleaaring and still leaving', this.startActivityClearIntervals, sw.state())
            this.startActivity = new Array()
            // AsyncStorage.setItem('HOME_STATE', JSON.stringify(this.state))
            console.log('Activity saved ...', this.state)
        }
        Utils.storage.save('HOME_STATE', this.state, true)
    }
       
    handleInactive = () => {
        console.log("The application is now inactive!");
    }

    render() {
        return (
            <View style={{ ...gstyles.MAIN_VIEW, backgroundColor: themes[themes.current].colors.background }}>
                <StatusBar 
                    backgroundColor={ themes[themes.current].colors.background }
                    barStyle={ themes.current === 'light' ? 'dark-content' : 'light-content' }
                />
                <Spinner
                    visible={this.state.isLoading}
                    textContent={'Loading...'}
                    textStyle={{ color: invert(themes[themes.current].colors.background) }}
                    color={Utils.randomColors.random()}
                    cancelable={true}
                    animation='fade'
                    size='large'
                />
                <AppStateListener
                    onActive={this.handleActive}
                    onBackground={this.handleBackground}
                    onInactive={this.handleInactive}
                />
                <View style={{ flex: 0.30, ...gstyles.CENTER}}>
                    {
                        this.state.startedActivity ? this.renderWhenTheirIsActivityRunning() : this.renderWhenTheirIsNoActivityRunning()
                    }
                </View>
                <View style={{flex: 0.69}}>
                    <FlatList 
                        data={this.state.activities}
                        ListEmptyComponent={this.forFirstTimeUse}
                        renderItem={this.listActivities}
                    >
                    </FlatList>
                </View>
                <View style={{flex: 0.01}}>
                    <FAB
                        style={{...gstyles.FAB, backgroundColor: this.state.randomColor}}
                        small
                        icon="add"
                        onPress={() => this.props.navigation.navigate('CreateEditActivity', {title: `Create activity`})}
                    />
                    { this.renderMoods() }
                    { this.renderNotesDialog() }
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    emoji: {
        fontSize: 50,
    }
})