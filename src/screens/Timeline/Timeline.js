import React from 'react'
import {FlatList, Image, ScrollView, StyleSheet, View} from 'react-native'
import gstyles from '../../components/styles'
import {showMessage} from 'react-native-flash-message'
import db from '../../logic/db'
import sql from '../../logic/sql'
import {Button, Caption, Colors, IconButton, Switch, Text, TextInput, Title,} from 'react-native-paper';
import Emoji from 'react-native-emoji';
import ProgressCircle from 'react-native-progress-circle'
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';
import Utils from '../../logic/Utils';
import Spinner from 'react-native-loading-spinner-overlay';
import {Calendar} from 'react-native-calendars';
import themes from '../../components/theme';
import invert from 'invert-color';

const moment = require('moment');
const moodImages = {
    happy: require('../../assets/happy.jpg'),
    joy: require('../../assets/joy.jpg'),
    neutral: require('../../assets/neutral.jpeg'),
    sad: require('../../assets/sad.jpg'),
    angry: require('../../assets/angry.jpeg'),
    default: require('../../assets/default.jpg')
}


export default class Timeline extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            activityLogs: [],
            allTimeTimeline: false,
            firstQuery: '',
            isSearching: false,
            currentSwipedDate: moment(),
            selectedDate: moment().format('YYYY-MM-DD'),
            dateCaption: moment().format('DD/MM/YYYY'),
            isLoading: true,
            whenNoActivitiesFound: 'There are no activities found for today hence no timeline',
            markedDates: {},
            markedDatesUntouched: {},
            randomColor: Utils.randomColors.random(),
            showMoodColors: false,
            hideShowMoodColor: false,
            expanded: false,
            height: 400,
        }
    }

    async componentDidMount(){
        try {
            Utils.orientation.portraitOnly()
            dateToSearch = moment(new Date().getTime()).format('YYYY-MM-DD')
            activityLogs = await db.run(sql.activityLogsForADay.join(' '), [`%${dateToSearch}%`])
            let calendarData = await Utils.applyMoodsToCalendarView({
                start: moment().startOf('month').format('YYYY-MM-DD 00:00:00'),
                end: moment().endOf('month').format('YYYY-MM-DD 23:59:59')
            })
            this.setState({ activityLogs: activityLogs.rows.raw(), 
                markedDates: calendarData.markedDates, 
                isLoading: false,
                markedDatesUntouched: calendarData.markedDatesUntouched
            })
            this.props.navigation.addListener('willFocus', async () => {
                Utils.orientation.portraitOnly()
                dateToSearch = moment(new Date().getTime()).format('YYYY-MM-DD')
                activityLogs = await db.run(sql.activityLogsForADay.join(' '), [`%${dateToSearch}%`])
                // console.log(' finished.....', this.state.markedDates)
                this.setState({ activityLogs: activityLogs.rows.raw(), })
            });
        } catch(err) {
            console.warn(err)
            showMessage({
                message: `An error occured getting timeline of activities. The error is: ${err}`,
                type: 'danger',
            })
            this.setState({ isLoading: false })
        }  
    }


    onDayPress = day => {
        this.setState({ 
            selectedDate: day.dateString,
            markedDates: { 
                ...this.state.markedDatesUntouched, 
                [day.dateString]: {startingDay: true, color: 'blue', endingDay: true}
            }
        })
    }


    forFirstTimeUse = () => (
        <View>
            <Caption>
                { this.state.whenNoActivitiesFound }
            </Caption>
        </View>
    )

    getTotalDuration(startTime, endTime) {
        let st = moment(startTime, 'YYYY-MM-DD HH:mm:ss')
        let et = moment(endTime, 'YYYY-MM-DD HH:mm:ss')
        let duration = moment.duration( et.diff(st) )
        return duration
    }

    getAppropriateCardImageBasedOnMood(mood){
        switch(mood){
            case 'Joy': return moodImages.joy
            case 'Happy': return moodImages.happy
            case 'Neutral': return moodImages.neutral
            case 'Sad': return moodImages.sad
            case 'Angry': return moodImages.angry
        }
    }

    calculateGoalProgress(item){
        activityDuration = this.getTotalDuration(item.logStartTime, item.logEndTime)
        goalDuration = moment.duration(item.goalLength)
        diff = activityDuration._milliseconds / goalDuration._milliseconds * 100
        return diff
    }

    renderTimelineActivity = ({item}) => {
        let iconButton = 
            <IconButton 
                icon='delete-forever'
                color={'red'}
                style={{ alignSelf: 'flex-end' }}
                onPress={() => {
                    db.run(sql.deleteLog, [item.logId]).then( result => {
                        if (result.rowsAffected === 1) {
                            activityLogs = this.state.activityLogs.filter( obj => 
                                JSON.stringify(obj) !== JSON.stringify(item)
                            )
                            this.setState({ activityLogs: activityLogs})
                            showMessage({
                                message: 'Deleted successfully',
                                type: 'info'
                            })
                        }
                    })
                }}
            />

        let progressCircle =
            <ProgressCircle
                percent={this.calculateGoalProgress(item)}
                radius={20}
                borderWidth={4}
                color={Utils.colorBasedOnMood(item.moodName)}
                shadowColor="#999"
                bgColor={themes[themes.current].colors.background}
            >
                <Text style={{ fontSize: 10 }}>{this.calculateGoalProgress(item).toFixed()}%</Text>
            </ProgressCircle>
        
        let duration = this.getTotalDuration(item.logStartTime, item.logEndTime)

        let timeAndMood =
            <View style={{ 
                marginLeft: 6, 
                ...gstyles.HORIZONTAL_ROW, 
                flex: 1, 
                marginTop: item.logNote.length > 100 ? -15 : 30,
            }}>
                <View style={{ flex: 0.35}}>
                    <Caption style={{ marginBottom: -10}}>{moment(item.logStartTime).format('DD/MM/YYYY')}</Caption>
                    <Caption style={{ marginBottom: -10}}>
                        <Caption style={{ fontWeight: 'bold'}}>From </Caption>
                        <Caption>{moment(item.logStartTime).format('HH:mm:ss')}</Caption>
                    </Caption>
                    <Caption>
                        <Caption style={{ fontWeight: 'bold' }}>Until </Caption>
                        <Caption>{moment(item.logEndTime).format('HH:mm:ss')}</Caption>
                    </Caption>
                </View>
                {
                    item.moodId ? 
                    <View style={{ flex: 0.20, ...gstyles.CENTER }}>
                        <Emoji name={item.moodEmoji} style={{fontSize: 25}} />
                    </View> : (null)
                }
                <View style={{ flex: 0.25, ...gstyles.CENTER}}>
                    { item.goalLength > 0 ? progressCircle : (null) }
                </View>
                <View style={{ flex: 0.15 }}>
                    { iconButton }
                </View>
            </View>

        let logNote = 
            <View style={{...gstyles.HORIZONTAL_ROW, height: 110}}>
                <Text style={{ margin: 6, marginTop: -10 }}>
                    { item.logNote.substr(0, 200) } 
                    <Text
                        onPress={() => {
                            showMessage({
                                message: item.logNote,
                                autoHide: false,
                                type: 'info'
                            })
                        }}
                        style={{ fontWeight: 'bold', color: Colors.blueA700 }}
                    >
                            ...more
                    </Text>
                </Text>
            </View>

        let backgroundColor = () => {

            return item.moodId 
                   ? 'rgba(255,255,255,0.5)' 
                   : Utils.colorBasedOnMood()

        }

        return(
            <View style={{ height: 220, 
                           width: '98%', 
                           flexDirection: 'row', 
                           borderRadius: 12, 
                           alignSelf: 'center',
                           marginBottom: 15,
            }}>
            {
                item.moodId ?
                <Image
                    style={{ height: 220, width: '100%', position: 'absolute', borderRadius: 12, resizeMode: 'cover', opacity: 0.55 }}
                    source={ this.getAppropriateCardImageBasedOnMood(item.moodName) }
                /> : (null)
            }
                <View style={{ flex: 1, backgroundColor: backgroundColor(), alignSelf: 'flex-end', borderRadius: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold',  margin: 6 }}>
                        { item.activityName } for { duration.hours() }h { duration.minutes() }m
                    </Text>
                    {
                        item.logNote.length > 200 ? logNote : <Text style={{ margin: 6, marginTop: -10 }}> { item.logNote } </Text>
                    }
                    { timeAndMood }
                </View>
            </View>
        )

    }

    handleDatePicked = dt => {
        // console.log('here is the date =>', this.state.currentSwipedDate, dt, this.state.selectedDate, 'after ', moment(dt.timestamp).format('YYYY-MM-DD'))
        let dateToSearch = moment(dt.timestamp).format('YYYY-MM-DD')
        // console.log( this.someRandomVariableForTest.length )
        this.setState({ 
            dateCaption: moment(dt.timestamp).format('DD/MM/YYYY'),
            currentSwipedDate: moment(dt.timestamp),
            selectedDate: moment(dt.timestamp).format('YYYY-MM-DD'),
            markedDates: { 
                ...this.state.markedDatesUntouched, 
                [moment(dt.timestamp).format('YYYY-MM-DD')]: {startingDay: true, color: 'blue', endingDay: true}
            }
        })
        db.run(sql.activityLogsForADay.join(' '), [`%${dateToSearch}%`]).then( result => {
            if (result.rows.length >= 1) {
                this.setState({ activityLogs: result.rows.raw() })
                // console.log(this.state.activityLogs, result.rows.raw())
            } else {
                this.setState({ 
                    activityLogs: [],
                    whenNoActivitiesFound: `There are no activity logs for ${this.state.dateCaption}. Try a different date`
                })
            }
        })
        this.setState({ isDateTimePickerVisible: false })
        // console.log('here is the date =>', this.state.currentSwipedDate, dt, this.state.selectedDate)
    }

    getAllTimeLineLogs = () => {
        this.setState({ allTimeTimeline: !this.state.allTimeTimeline })
        if (!this.state.allTimeTimeline) {
            this.setState({ isLoading: true })
            db.run(sql.activityLogs.join(' ')).then( result => {
                this.setState({ activityLogs: result.rows.raw(), isLoading: false })
            })
        }
    }

    searchActivityLogs = () => {
        this.setState({ isLoading: true })
        logNote = `%${this.state.firstQuery}%`
        activityName = `%${this.state.firstQuery}%`
        moodName = `%${this.state.firstQuery}%`

        db.run(sql.activityLogsSearch.join(' '), [logNote, activityName, moodName]).then( result => {
            if (result.rows.length >= 1) {
                this.setState({ activityLogs: result.rows.raw(), isLoading: false })
            } else {
                this.setState({ isSearching: false, isLoading: false })
                showMessage({
                    message: 'It didnt match anything. Try using less keywords or different keywords',
                    type: 'info'
                })
            }
        })
    }

    onSwipe(gestureName, gestureState) {
        const {SWIPE_UP, SWIPE_DOWN, SWIPE_LEFT, SWIPE_RIGHT} = swipeDirections;
        this.setState({gestureName: gestureName});

        if ( gestureName === SWIPE_LEFT || gestureName === SWIPE_RIGHT) {
            this.updateTimelineNextOrBeforeDay(gestureName)
        }
    }

    updateTimelineNextOrBeforeDay(gestureName) {
        if (gestureName === swipeDirections.SWIPE_LEFT) {
            let newDate = this.state.currentSwipedDate.add(1, 'd')
            this.setState({ currentSwipedDate: newDate, 
                selectedDate: moment(newDate).format('YYYY-MM-DD'),
                markedDates: { 
                    ...this.state.markedDatesUntouched, 
                    [moment(newDate).format('YYYY-MM-DD')]: {startingDay: true, color: 'blue', endingDay: true}
                }
            })
        } else if (gestureName === swipeDirections.SWIPE_RIGHT) {
            let newDate = this.state.currentSwipedDate.subtract(1, 'd') 
            this.setState({ currentSwipedDate: newDate,
                selectedDate: moment(newDate).format('YYYY-MM-DD'),
                markedDates: { 
                    ...this.state.markedDatesUntouched, 
                    [moment(newDate).format('YYYY-MM-DD')]: {startingDay: true, color: 'blue', endingDay: true}
                }
            })
        }
        this.setState({ dateCaption: this.state.currentSwipedDate.format('DD/MM/YYYY'), isLoading: true, allTimeTimeline: false })
        db.run(sql.activityLogsForADay.join(' '), [`%${this.state.currentSwipedDate.format('YYYY-MM-DD')}%`]).then( result => {
            if (result.rows.length >= 1) {
                this.setState({ activityLogs: result.rows.raw(), isLoading: false })
            } else {
                this.setState({ isLoading: false, })
                this.setState({ 
                    activityLogs: [],
                    whenNoActivitiesFound: `There are no activity logs for ${this.state.dateCaption}. Keep swiping.`
                })
            }
        })
    }

    render() {
        return (
            <View style={{...gstyles.MAIN_VIEW, backgroundColor: themes[themes.current].colors.background}}>
                <Spinner
                    visible={this.state.isLoading}
                    textContent={'Loading...'}
                    textStyle={{ color: invert(themes[themes.current].colors.background) }}
                    color={Utils.randomColors.random()}
                    cancelable={true}
                    animation='fade'
                    size='large'
                />
                <View style={{ flex: 0.2}}>
                    <View style={{ ...gstyles.HORIZONTAL_ROW, flex: 1.50}}>
                        <TextInput
                            label='Search activity, notes, mood'
                            mode='flat'
                            value={this.state.firstQuery}
                            onChangeText={ val => this.setState({ firstQuery: val })}
                            style={{ flex: 0.95, height: 50, marginRight: 5, ...gstyles.TRANSPARENT_TEXTINPUT }}
                        />
                        <Button
                            mode='text'
                            icon='search'
                            loading={this.state.isSearching}
                            style={{ flex: 0.05, width: 10, borderRadius: 50 }}
                            onPress={this.searchActivityLogs}
                        />
                    </View>
                    <View style={{...gstyles.ROWS_SPACEBETWEEN, flex: 1.25, marginBottom: 0}}>
                        <Title>All time timeline</Title>
                        <Switch
                            value={this.state.allTimeTimeline}
                            onValueChange={this.getAllTimeLineLogs}
                        />
                    </View>
                </View>
                <ScrollView style={{flex: 0.80}}>

                    <View>
                        <View style={{...gstyles.ROWS_SPACEBETWEEN, display: this.state.hideShowMoodColor ? 'none' : 'flex' }}>
                            <View style={gstyles.HORIZONTAL_ROW}>
                                <Text>Show mood colors</Text>
                                <Button 
                                    mode={'text'}
                                    compact={true}
                                    style={{ marginTop: -10, marginLeft: 3, height: 30, alignSelf: 'center' }}
                                    color={ Utils.randomColors.random() }
                                    onPress={() => this.setState({ hideShowMoodColor: !this.state.hideShowMoodColor, showMoodColors: false }) }
                                >
                                Hide me
                                </Button>
                            </View>
                            <Switch
                                value={this.state.showMoodColors}
                                onValueChange={() => {
                                    this.setState({ 
                                        showMoodColors: !this.state.showMoodColors
                                    })
                                }}
                            />
                        </View>
                        <View style={{ ...gstyles.HORIZONTAL_ROW, display: this.state.showMoodColors ? 'flex' : 'none' }}>
                            <Text style={{ flex: 0.3, ...gstyles.CENTER }}>
                                Mood colors:
                            </Text>
                            <View style={{...gstyles.HORIZONTAL_ROW, flex: 0.70}}>
                                <Text style={{ backgroundColor: Utils.colorBasedOnMood('Joy'), margin: 2, borderRadius: 5, padding: 3, color: 'white' }}>
                                    Joy
                                </Text>
                                <Text style={{ backgroundColor: Utils.colorBasedOnMood('Happy'), margin: 2, borderRadius: 5, padding: 3, color: 'black' }}>
                                    Happy
                                </Text>
                                <Text style={{ backgroundColor: Utils.colorBasedOnMood('Neutral'), margin: 2, borderRadius: 5, padding: 3, color: 'black' }}>
                                    Neutral
                                </Text>
                                <Text style={{ backgroundColor: Utils.colorBasedOnMood('Sad'), margin: 2, borderRadius: 5, padding: 3, color: 'white' }}>
                                    Sad
                                </Text>
                                <Text style={{ backgroundColor: Utils.colorBasedOnMood('Angry'), margin: 2, borderRadius: 5, padding: 3, color: 'white' }}>
                                    Angry
                                </Text>
                                <Text style={{ backgroundColor: Utils.colorBasedOnMood(), margin: 2, borderRadius: 5, padding: 3, color: 'white' }}>
                                    Without mood
                                </Text>
                            </View>
                        </View>
                        <Calendar
                            style={{ borderRadius: 10, marginBottom: 5 }}
                            //   // Specify theme properties to override specific styles for calendar parts. Default = {}
                            theme={{
                                calendarBackground: '#dda902',
                                textSectionTitleColor: '#382828',
                                dayTextColor: 'white',
                                // todayTextColor: 'white',
                                selectedDayTextColor: 'black',
                                monthTextColor: 'white',
                                // selectedDayBackgroundColor: '#333248',
                                arrowColor: 'white',
                                // textDisabledColor: 'red',
                                'stylesheet.calendar.header': {
                                  week: {
                                    marginTop: 5,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between'
                                  }
                                }
                            }}
                            // Initially visible month. Default = Date()
                            // current={this.state.selectedDate}
                            // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
                            minDate={'2017-08-01'}
                            
                            // Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined
                            maxDate={new Date()}
                            // Handler which gets executed on day press. Default = undefined
                            onDayPress={day => this.handleDatePicked(day)}
                            // Handler which gets executed on day long press. Default = undefined
                            onDayLongPress={(day) => this.handleDatePicked(day)}
                            // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
                            monthFormat={'yyyy MMM'}
                            // Handler which gets executed when visible month changes in calendar. Default = undefined
                            onMonthChange={ async (month) => {
                                this.setState({ isLoading: true })
                                let calendarData = await Utils.applyMoodsToCalendarView({
                                    start: moment(month.timestamp).startOf('month').format('YYYY-MM-DD 00:00:00'),
                                    end: moment(month.timestamp).endOf('month').format('YYYY-MM-DD 23:59:59')
                                })
                                this.setState({ 
                                    markedDates: calendarData.markedDates, 
                                    isLoading: false,
                                    markedDatesUntouched: calendarData.markedDatesUntouched
                                })
                            } }
                            // Hide month navigation arrows. Default = false
                            // hideArrows={true}
                            // Replace default arrows with custom ones (direction can be 'left' or 'right')
                            // renderArrow={(direction) => (<Arrow />)}
                            // Do not show days of other months in month page. Default = false
                            hideExtraDays={true}
                            // If hideArrows=false and hideExtraDays=false do not switch month when tapping on greyed out
                            // day from another month that is visible in calendar page. Default = false
                            // disableMonthChange={true}
                            // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
                            firstDay={1}
                            // Hide day names. Default = false
                            hideDayNames={true}
                            // Show week numbers to the left. Default = false
                            // showWeekNumbers={true}
                            // Handler which gets executed when press arrow icon left. It receive a callback can go back month
                            onPressArrowLeft={substractMonth => substractMonth()}
                            // Handler which gets executed when press arrow icon left. It receive a callback can go next month
                            onPressArrowRight={addMonth => addMonth()}
                            markedDates={this.state.markedDates}
                            // Date marking style [simple/period/multi-dot/custom]. Default = 'simple'
                            markingType={'period'}
                        />
                    </View>
                    <GestureRecognizer
                        onSwipe={(direction, state) => this.onSwipe(direction, state)}
                        onSwipeLeft={(state) => this.updateTimelineNextOrBeforeDay(state)}
                        onSwipeRight={(state) => this.updateTimelineNextOrBeforeDay(state)}
                        config={{
                            velocityThreshold: 0.3,
                            directionalOffsetThreshold: 80
                        }}
                        style={{
                            flex: 1 
                        }}
                    >
                        <FlatList 
                            data={this.state.activityLogs}
                            // horizontal={false}
                            // numColumns={2}
                            ListEmptyComponent={this.forFirstTimeUse}
                            renderItem={this.renderTimelineActivity}
                            extraData={this.state}
                        >
                        </FlatList>
                    </GestureRecognizer>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({

})