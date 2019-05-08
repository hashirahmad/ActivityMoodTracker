import React from 'react'
import {FlatList, ScrollView, StatusBar, View} from 'react-native'
import gstyles from '../../components/styles'
import {showMessage} from 'react-native-flash-message'
import db from '../../logic/db'
import sql from '../../logic/sql'
import {Button, Caption, FAB, IconButton, ProgressBar, Switch, Text} from 'react-native-paper';
import {AreaChart, Grid, PieChart, ProgressCircle, StackedBarChart} from 'react-native-svg-charts'
import * as scale from 'd3-scale'
import * as shape from 'd3-shape'
import Snackbar from 'react-native-snackbar';
import Spinner from 'react-native-loading-spinner-overlay';
import Utils from '../../logic/Utils';
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';
import PureChart from 'react-native-pure-chart';
import {CalendarList} from 'react-native-calendars';
import {Circle} from 'react-native-svg';
import invert from 'invert-color';
import themes from '../../components/theme';

const moment = require('moment');

export default class Dashboard extends React.Component {

    constructor(props){
        super(props)
        this.dateUtils = {
            start: 'YYYY-MM-DD 00:00:00',
            end: 'YYYY-MM-DD 23:59:59',
            human: 'DD/MM/YYYY'
        }
        this.dropdown = [
            { value: 'Today', icon: 'today' },
            { value: 'This week', icon: 'looks-one' },
            { value: 'This month', icon: 'looks-4' },
            { value: 'Half a year', icon: 'looks-6' },
            { value: 'This year', icon: 'looks-one' },
            { value: 'All time', icon: 'all-inclusive' }
        ]
        this.chartTypeDropdowns = [
            { value: 'Total sum of Activities', icon: 'list' },
            { value: 'Sum of Activities by Mood', icon: 'insert-emoticon' },
            { value: 'Moods across the days', icon: 'view-day' },
            { value: 'Mood calendar', icon:  'today' },
            { value: 'Activity graph', icon: 'graphic-eq' }
        ]
        this.state = {
            isLoading: false,
            chartType: 'piechart',
            chartData: [],
            chartDataTag: [],
            totalSumActivities: true,
            moodSumActivities: false,
            moodsAcrossDays: false,
            dashboardActivitiesSumMoods: [],
            tappedActivityMoodName: '',
            selectedDates: { from: moment(), to: moment() },
            dates: { date: { from: moment(), to: moment() }, change: 1, unit: 'd' },
            progress: 0,
            lineChart: [],
            stackedBarChart: true,
            showAllDates: false,
            showTagsData: false,
            chartTypeDropdownsSelected: this.chartTypeDropdowns[0].value,
            selectedTimeFrame: this.dropdown[0].value,
            selectedDate: moment().format('YYYY-MM-DD'),
            markedDates: {},
            activityGraph: [],
            activities: [{ value: 'All', id: null }],
            selectedActivity: {},
            curve: shape.curveNatural,
            randomColor: Utils.randomColors.random(),
            randomColor2: Utils.randomColors.random(),
            dashboardIconsColors: invert(Utils.randomColors.bright()),
            showMoodColors: false,
            hideShowMoodColor: false,
        }
        this.chartData = []
        this.chartDataTag = []
        this.moodSumEachDay = {
            colors: [
                Utils.colorBasedOnMood('Joy'),
                Utils.colorBasedOnMood('Happy'),
                Utils.colorBasedOnMood('Neutral'),
                Utils.colorBasedOnMood('Sad'),
                Utils.colorBasedOnMood('Angry'),
                Utils.colorBasedOnMood()
            ],
            keys: ['Joy', 'Happy', 'Neutral', 'Sad', 'Angry', 'Without mood']
        }
        this.tappedDatesForStackBar = []


        db.run( sql.activities.join(' ') ).then( result => {

            let activities = result.rows.raw()
            activities.forEach( activity => {
                
                this.state.activities.push({ value: activity.activityName, id: activity.activityId })
                
            })
            this.state.selectedActivity = this.state.activities[0]

        })


        this.totalSumActivitiesDashboard()
    }

    getCorrespondingActivitiesMoods = (sqlSt, id, name, date) => {
        this.setState({ isLoading: true })
        let params = [
            date.from.format(this.dateUtils.start),
            date.to.format(this.dateUtils.end),
            id
        ]

        if (id === null && (sqlSt === sql.dashboardActivitiesSumActivities || sqlSt  === sql.dashboardActivitiesSum)) {
            sqlSt = sqlSt !== sql.dashboardActivitiesSumActivitiesForNull ? sql.dashboardActivitiesSum : sql.dashboardActivitiesSumActivitiesForNull
            params.pop()
        }

        db.run(sqlSt.join(' '), params).then( result => {
            result = result.rows.raw()
            if (result.length > 0) {
                this.state.dashboardActivitiesSumMoods.length = 0
                let sumLogDiff = result.reduce((total, obj) => obj.logDiff + total,0)
                console.log('TAPPED DATA :', result, sumLogDiff)
                result.forEach( obj => {

                    if (obj.logDiff > 0) {
                        this.state.dashboardActivitiesSumMoods.push({
                            name: obj[name],
                            value: obj.logDiff / sumLogDiff,
                            mins: obj.logDiff,
                            isMood: name.includes('mood') 
                        })
                    }

                })
                // console.log('data to be progress', resultProgress, result)
                this.setState({ isLoading: false })
            } else {
                Snackbar.show({ 
                    title: `${this.state.tappedActivityMoodName} does not not have any corresponding data`, 
                    duration: Snackbar.LENGTH_LONG
                })
                this.setState({ tappedActivityMoodName: '', isLoading: false })
            }
        }).catch( err => {
            this.setState({ isLoading: false })
            showMessage({
                message: `An error occured when trying to get corresponding mood or activity. Here is the error: ${err}`,
                type: 'warning'
            })
        })
    }

    pad = n => {
        return n < 10 ? '0' + n : n;
    }

    humanTime(minutes) {
        let duration = moment.duration(minutes, 'minutes')
        return this.formattedTime(duration)
    }

    formattedTime = duration => {
        let shortTime = `${this.pad( duration.hours() )} hrs, ${this.pad( duration.minutes() )} mins`
        let longTime = `${duration.days()} days, ${this.pad( duration.hours() )} hrs & ${this.pad( duration.minutes() )} mins`
        let xLongTime = `${duration.months()} months, ${duration.days()} days, ${this.pad( duration.hours() )} hrs & ${this.pad( duration.minutes() )} mins`
        return duration.months() > 0 ? xLongTime : duration.days() > 0 ? longTime : shortTime
    }

    showStatsOnTap = (data, date, type, name) => {
        let tappedActivityMoodName = `${data[name]} - ${ this.humanTime( data.logDiff ) }`
        // console.log(' tapped data', data, tappedActivityMoodName)

        this.setState({ 
            tappedActivityMoodName: tappedActivityMoodName,
            selectedDates: date
        })
        this.tappedDatesForStackBar.push( date.from.format(this.dateUtils.human) )
        console.log('Trigged on tap...', data, date)
        switch(type) {
            case "activity": this.getCorrespondingActivitiesMoods(sql.dashboardActivitiesSumMoods, data.activityId, "moodName", date)
                             break;
            case "activityAll": this.getCorrespondingActivitiesMoods(sql.dashboardActivitiesSum, null, "activityName", date)
                                break;
            case "mood": this.getCorrespondingActivitiesMoods(sql.dashboardActivitiesSumActivities, data.moodId, "activityName", date)
                         break;
            case "moodsForTag": this.getCorrespondingActivitiesMoods(sql.dashboardCorrespondingMoodForTags, data.tagId, "moodName", date)
                                break;
            case "tagsForMood": this.getCorrespondingActivitiesMoods(sql.dashboardCorrespondingTagsForMood, data.moodId, "tagName", date)
                                break;
        }
    }

    generateDashbaord = type => {
        switch(type){
            case 'Today':
                this.state.dates.date.from = moment().startOf('d')
                this.state.dates.date.to = moment().endOf('d')
                this.state.dates.unit = 'd'
                break
            case 'This week': 
                this.state.dates.date.from = moment().startOf('isoWeek')
                this.state.dates.date.to = moment().endOf('isoWeek')
                this.state.dates.unit = 'w'
                break
            case 'This month': 
                this.state.dates.date.from = moment().startOf('month')
                this.state.dates.date.to = moment().endOf('month')
                this.state.dates.unit = 'M'
                break
            case 'Half a year':
                this.state.dates.date.from = moment().startOf('month')
                this.state.dates.date.to = moment().endOf('month').add(5, 'months')
                this.state.dates.unit = 'hy'
                break
            case 'This year': 
                this.state.dates.date.from = moment().startOf('year')
                this.state.dates.date.to = moment().endOf('year')
                this.state.dates.unit = 'y'
                break
            default:
                this.state.dates.date.from = moment('2017-01-01 00:00:00')
                this.state.dates.date.to = moment()
                this.setState({ alltime: true })
                break
        }

        this.dropdown.push(
            this.dropdown.splice(
                this.dropdown.indexOf( 
                    this.dropdown.filter(o => o.value === type )[0]
                ), 
            1)[0]
        )

        this.setState({ tappedActivityMoodName: '', selectedTimeFrame: type, dates: this.state.dates, chartData: [] })
        this.showDashboardOnDropdown(this.state.chartTypeDropdownsSelected)
    }

    populateChartData = data => {
        this.setState({ isLoading: true })
        let params = [
            data.dates.from.format(this.dateUtils.start),
            data.dates.to.format(this.dateUtils.end)
        ]
        db.run(data.sql, params).then( result => {
            let stats = result.rows.raw()
            // console.log('chartdata ===>>>', stats)
            this.chartData.length = 0
            // this.state.chartData.length = 0
            if (stats.length > 0) {
                stats.forEach( obj => {
                    this.chartData.push({
                        key: obj[data.name],
                        value: obj.logDiff,
                        svg: { 
                            fill: !data.moodColor ? Utils.randomColors.random() : Utils.colorBasedOnMood(obj[data.name]), 
                            onPress: () => this.showStatsOnTap(obj, data.dates, data.type, data.name)  
                        },
                    })
                })
                this.setState({ chartType: data.chartType, chartData: this.chartData })
            } else {
                this.setState({ tappedActivityMoodName: '' })
            }
            this.setState({ isLoading: false })
        })
        // console.log('got data', data)
    }

    totalSumActivitiesDashboard = (dates = this.state.dates.date) => {
        console.log(this.state.showTagsData, ' tags')
        
        if (this.state.showTagsData) this.tagsDashboard(dates)
        else this.populateChartData({
            sql: sql.dashboardActivitiesSum.join(' '),
            name: 'activityName',
            dates,
            moodColor: false,
            type: 'activity',
            chartType: this.state.chartTypeDropdownsSelected === 'Mood calendar' ? 'moodCalendar' : 'piechart'
        })

    }

    moodSumActivitiesDashboard = (dates = this.state.dates.date) => {

        if (this.state.showTagsData) this.moodSumTagsDashboard()
        else this.populateChartData({
            sql: sql.dashboardMoodSum.join(' '),
            name: 'moodName',
            dates,
            moodColor: true,
            type: 'mood',
            chartType: 'piechart'
        })

    }

    tagsDashboard = ( dates = this.state.dates.date ) => {
        console.log('I am now running for tags', sql.dashboardTagSum)
        this.populateChartData({
            sql: sql.dashboardTagSum.join(' '),
            name: 'tagName',
            dates,
            moodColor: false,
            type: 'moodsForTag',
            chartType: this.state.chartTypeDropdownsSelected === 'Mood calendar' ? 'moodCalendar' : 'piechart'
        })
    }

    moodSumTagsDashboard = ( dates = this.state.dates.date ) => {
        this.populateChartData({
            sql: sql.dashboardMoodSumTags.join(' '),
            name: 'moodName',
            dates,
            moodColor: true,
            type: 'tagsForMood',
            chartType: 'piechart'
        })
    }

    indvidualActivityGraph = (dates = this.state.dates.date) => {

        // console.log(' here is runing ...')

        this.setState({ isLoading: true })
        let params = [
            dates.from.format(this.dateUtils.start),
            dates.to.format(this.dateUtils.end),
            dates.from.format(this.dateUtils.start),
            dates.to.format(this.dateUtils.end),
            this.state.selectedActivity.id
        ]

        if (this.state.selectedActivity.id === null) {
            sqlSt = sql.activityGraphAll
            params.pop()
        } else sqlSt = sql.activityGraph

        if ( dates.to.diff( dates.from, 'day' ) < 200 && dates.to.diff( dates.from, 'day' ) > 4   ) {

            db.run(sqlSt.join(' '), params).then(result => {
    
                let stats = result.rows.raw()
                console.log(stats, ' here is the stats')
                let activityGraph = []
                if ( stats.length > 0 ) {
    
                    this.state.activityGraph.length = 0
                    stats.forEach( stat => {
    
                        activityGraph.push({
    
                            id: stat.day,
                            date: moment(stat.day).toDate(),
                            moodName: stat.moodName,
                            moodId: stat.moodId,
                            score: stat.logDiff
    
                        })
    
                    })
                    
                }
                this.setState({ isLoading: false, chartType: 'activityGraph', activityGraph })
    
            })
        } else {
            let message = `Activity graph is limited to half a year's data for now.`
            if (dates.to.diff( dates.from, 'day' ) === 0 ) message = `Activity graph needs data of at least few days i.e. for a week.`

            showMessage({
                message: message,
                type: 'info',
                autoHide: false,
            })
            this.setState({ isLoading: false })
        }

    }

    moodCalendar = () => {
        this.setState({ isLoading: true });
        Utils.applyMoodsToCalendarView().then(result => {
            this.setState({
                chartType: 'moodCalendar',
                chartData: [],
                markedDates: result.markedDates,
                isLoading: false
            });
        });
    }

    moodSumByEachDay = async (dates = this.state.dates.date) => {
        this.setState({ isLoading: true, chartType: 'stackedbarchart', })
        // this.state.chartData.length = 0
        this.chartData.length = 0
        let counter = 0
        let diff
        let lineChart = this.moodSumEachDay.keys.map( key => {
            return {
                seriesName: key,
                data: [],
                color: Utils.colorBasedOnMood(key)
            }
        })

        let params = [
            dates.from.format(this.dateUtils.start),
            dates.to.format(this.dateUtils.end),
            dates.from.format(this.dateUtils.start),
            dates.to.format(this.dateUtils.end),
        ]

        let rowsBetter = []

        db.run( sql.moodSumByEachDayBetter.join(' ') , params ).then( result => {

            let stats = result.rows.raw()

            if (stats.length > 0) {

                stats.forEach( stat => {

                    let row = stat.obj.split(' > ').map( indvidaulRow => JSON.parse(indvidaulRow) )
                    rowsBetter.push(row)
                
                })
                console.log(' rowsbetter', rowsBetter)
                diff = rowsBetter.length

                rowsBetter.forEach( rowOfRows => {

                    let rows = this.includeAllMoodsAndKeepDaysConsistent(rowOfRows)
                    // console.log('generated data is after ', rows)
                    let chartDay = {}
                    rows.forEach( row => {
                        let d = { from: moment(row.date), to: moment(row.date) }
                        // console.log('new bug here: ', row,d)

                        chartDay[row.moodName] = {
                            value: row.logDiff,
                            svg: {
                                onPress: () => this.showStatsOnTap(row, d, 'mood', 'moodName')
                            },
                        }
                        chartDay["dates"] = d
                        lineChart = this.drawLineChart(lineChart, row, d.from)
                    })
                    counter++
                    this.setState({ progress: counter / diff  }, () => console.log(this.state.progress, 'progress now'))
                    this.chartData.push(chartDay)
                    // console.log( 'original ====== ', result.rows.raw(), ' better one: ', rowsBetter)

                })
                this.setState({ 
                    isLoading: false,  
                    chartData: this.chartData,
                    lineChart
                })

            } else this.setState({ isLoading: false })

        })

    }

    drawLineChart = (lineChart, row, date) => {

        let series = lineChart.filter(obj => obj.seriesName === row.moodName)[0]
        series = series ? series : lineChart.filter(obj => obj.seriesName === 'Untracked')[0]

        console.log(row, 'errro', series, lineChart)

        series.data.push({
            x: date.format('DD/MM/YY'),
            y: parseFloat( (row.logDiff / 60).toFixed(2) )
        })

        return lineChart
    }

    includeAllMoodsAndKeepDaysConsistent = (rows) => {

        let extraRows = []
        if (rows.length > 0) {

            let moodsPresent = rows.map( row => { return row.moodName })
            this.moodSumEachDay.keys.forEach( (key) => {
                if (!moodsPresent.includes(key)) {
                    extraRows.push({
                        moodName: key,
                        date: rows[0].date,
                        // moodId: i+1,
                        logDiff: 0
                    })
                }
            })

            return rows.concat(extraRows)

        } else {
            return this.state.showAllDates ? this.moodSumEachDay.keys.map( (key) => {
                return {
                    moodName: key,
                    // moodId: i+1,
                    logDiff: 0
                }
            }) : []
        }
    }

    keepMoodsConsistent = (chartDay) => {
        console.log('orginal chartday =>', chartDay)
        this.moodSumEachDay.keys.forEach( mood => {
            if (!chartDay.hasOwnProperty(mood)) {
                chartDay[mood] = {
                    value: 0,
                    svg: { onPress: () => console.log('Nothing to press')}
                }
            }
        })
        console.log('chartday =>', chartDay)
        return chartDay
    }

    showDasboardForCalendarDay = day => {
        this.setState({ tappedActivityMoodName: '' })
        this.totalSumActivitiesDashboard({
            from: moment(day.timestamp).startOf('day'),
            to: moment(day.timestamp).endOf('day')
        })
    }

    showActivitySumData = () => {

        let chartData = this.state.chartData
        let stackedBarChartData = []
        let counter = 0
        console.log('chart data ==>', this.state.chartData)
        if (this.state.chartType === 'piechart' || this.state.chartType === 'moodCalendar') {
            chartData = this.state.chartData.map( obj => {
                return {
                    ...obj,
                    arc: { outerRadius: this.state.tappedActivityMoodName.includes(obj.key) ? '115%' : '100%',
                        cornerRadius: this.state.tappedActivityMoodName.includes(obj.key) ? 10 : 0
                    }
                }
            })
        } else if (this.state.chartType === 'stackedbarchart' && this.state.stackedBarChart) {

            for (let i = 0; i < this.state.chartData.length; i++) {

                let obj = this.state.chartData[ i ]
                let day = obj
                let keys = Object.keys( obj )

                if (
                    (
                        this.state.selectedDates.from.format(this.dateUtils.human) === obj.dates.from.format(this.dateUtils.human) 
                     && this.state.selectedDates.to.format(this.dateUtils.human) === obj.dates.to.format(this.dateUtils.human)
                    ) || this.tappedDatesForStackBar.includes( obj.dates.from.format(this.dateUtils.human) )
                ) {
                    for (j = 0; j < keys.length; j++) {
    
                        let key = keys[j]
    
                        if (key !== 'dates') {
                            if (this.state.tappedActivityMoodName.includes(key) 
                            && this.state.selectedDates.from.format(this.dateUtils.human) === obj.dates.from.format(this.dateUtils.human)
                            && this.state.selectedDates.to.format(this.dateUtils.human) === obj.dates.to.format(this.dateUtils.human)
                            ) {
                                let color = Utils.dashboardTappingColor
                                obj[key].svg = {
                                    ...obj[key].svg,
                                    stroke: color,
                                    strokeWidth: 3,
                                }
                                day[key] = obj[key]
                            } else {
                                obj[key].svg = {
                                    ...obj[key].svg,
                                    stroke: 'none',
                                    strokeWidth: 1,
    
                                }
                                day[key] = obj[key]
                            }
                        } else day[key] = obj[key]
                        console.log(' I happen here.. done :', i)
                    }
                }

                stackedBarChartData.push( day )

            }
            // console.log('returned stacked bar chart', stackedBarChartData, ' original one ', this.state.chartData)
        }


        let pieChart = <ScrollView>
                            <PieChart
                                style={{ height: 300 }}
                                animate={true}
                                animationDuration={3000}
                                outerRadius={'75%'}
                                innerRadius={'35%'}
                                data={chartData}
                            /> 
                            <View style={{ marginTop: -30, marginBottom: 10 }}>
                                <Text style={{ margin: 5, ...gstyles.CENTER }}>Select an activity or tap on chart</Text>
                                    <View style={gstyles.HORIZONTAL_ROW}>
                                        {
                                            (this.state.chartType === 'piechart' || this.state.chartType === 'moodCalendar') && chartData.map(obj => (
                                                <Button 
                                                    mode={'contained'}
                                                    compact={ true }
                                                    style={{ ...gstyles.COMPACT_BTN }}
                                                    color={ this.state.tappedActivityMoodName.includes(obj.key) ? Utils.dashboardTappingColor : obj.svg.fill }
                                                    onPress={ () => obj.svg.onPress() }
                                                >
                                                {obj.key}
                                                </Button>
                                            ))
                                        }
                                    </View>
                            </View>
                        </ScrollView>
        
        let whenNoData = <View style={{ height: 300 }}>
                            <Caption style={{ alignSelf: 'center' }}>
                                No data found between 
                                <Caption style={{ fontWeight: 'bold', marginLeft: 5 }}>
                                    {this.state.dates.date.from.format(this.dateUtils.human)} 
                                </Caption> til 
                                <Caption style={{ fontWeight: 'bold', marginLeft: 5 }}>
                                    {this.state.dates.date.to.format(this.dateUtils.human)} 
                                </Caption>
                            </Caption>
                        </View>
        
        let stackedBarChart = <ScrollView>
                                    <ScrollView horizontal={true}>
                                        <View style={{ width: (this.state.chartData.length * 28), height: 300 }}>
                                            <StackedBarChart
                                                style={ { height: 300, } }
                                                animate={true}
                                                keys={ this.moodSumEachDay.keys }
                                                colors={ this.moodSumEachDay.colors }
                                                data={ stackedBarChartData }
                                                showGrid={ true }
                                                contentInset={ { top: 30, bottom: 30 } }
                                                valueAccessor={ ({ item, key }) => item[ key ].value }
                                            >
                                                
                                            </StackedBarChart>
                                        </View>
                                    </ScrollView>
                                    <View>
                                    <Text style={{ margin: 5, ...gstyles.CENTER }}>Tap on the bar or select a mood below</Text>
                                        {
                                            this.state.chartType === 'stackedbarchart' && this.state.stackedBarChart && 
                                            this.chartData.map( obj => (

                                                this.state.selectedDates.from.format(this.dateUtils.human) === obj.dates.from.format(this.dateUtils.human) &&
                                                this.state.selectedDates.to.format(this.dateUtils.human) === obj.dates.to.format(this.dateUtils.human) && 
                                                <View style={{...gstyles.HORIZONTAL_ROW, 
                                                              margin: 5, 
                                                            }}
                                                >
                                                    {
                                                        Object.keys(obj).map( key => {
                                                            if (key !== 'dates') {
                                                                return <Button 
                                                                            mode={'contained'}
                                                                            compact={ true }
                                                                            disabled={ obj[key].value === 0  }
                                                                            style={{ ...gstyles.COMPACT_BTN }}
                                                                            color={ this.state.tappedActivityMoodName.includes(key) ? Utils.dashboardTappingColor : Utils.colorBasedOnMood(key) }
                                                                            onPress={ () => obj[key].svg.onPress() }
                                                                        >
                                                                            {key}
                                                                        </Button>
                                                            }

                                                        })
                                                    }
                                                </View>
                                            ))
                                        }
                                    </View>
                                </ScrollView>

        let lineChart = <PureChart 
                            data={this.state.lineChart}
                            type={'line'} 
                            height={280}
                            backgroundColor={themes[themes.current].colors.background}
                        />
        let randomColor = Utils.randomColors.random()
        let moodCalendar = <View>
                                <CalendarList
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
                                    onDayPress={day => this.showDasboardForCalendarDay(day)}
                                    // Handler which gets executed on day long press. Default = undefined
                                    onDayLongPress={(day) => this.showDasboardForCalendarDay(day)}
                                    // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
                                    monthFormat={'yyyy MMM'}
                                    // Handler which gets executed when visible month changes in calendar. Default = undefined
                                    // onMonthChange={(month) => {
                                    //     this.moodCalendar({ from: moment(month.timestamp).startOf('month'), to: moment(month.timestamp).endOf('month') })
                                    // } }
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
                                    // onVisibleMonthsChange={(months) => {console.log('now these months are visible', months)}}
                                    pastScrollRange={ moment().diff('2017-08-01', 'months') }
                                    futureScrollRange={0}
                                    scrollEnabled={true}
                                    horizontal={true}
                                    showScrollIndicator={true}
                                />
                                { pieChart }
                            </View>

        let activityGraphPointClicking = (item) => {

            let key = this.state.selectedActivity.id === null ? 'moodId' : 'activityId'

            this.showStatsOnTap(
                { 
                    logDiff: item.score, 
                    date: `A ${item.moodName} ${moment(item.date).format('dddd')} for ${this.state.selectedActivity.value}`, 
                    [key]: this.state.selectedActivity.id === null ? item.moodId : this.state.selectedActivity.id
                },
                { from: moment(item.date).startOf('day'), to: moment(item.date).endOf('day') },
                this.state.selectedActivity.id === null ? 'activityAll' : 'activity',
                'date'
            )
        }
        
        let ChartPoints = ({ x, y }) =>
            this.state.activityGraph.map((item, index) => (
            <Circle
                key={index}
                cx={x(moment(item.date))}
                cy={y(item.score)}
                r={9}
                stroke={
                    this.state.selectedDates.from.format(this.dateUtils.human) === moment(item.date).format(this.dateUtils.human) ?
                    Utils.dashboardTappingColor : Utils.colorBasedOnMood(item.moodName) 
                }
                fill={ 
                    this.state.selectedDates.from.format(this.dateUtils.human) === moment(item.date).format(this.dateUtils.human) ?
                    Utils.dashboardTappingColor : Utils.colorBasedOnMood(item.moodName)  
                }
                onPress={ () => activityGraphPointClicking(item) }
            />
        ));

        let activityGraph = <View>
                                <View style={{ marginBottom: 10 }}>
                                    <Text style={{...gstyles.CENTER}}>{' << Select activity >>'}</Text>
                                    <ScrollView horizontal={true}>
                                        <View style={gstyles.HORIZONTAL_ROW}>
                                            {
                                                (this.state.chartType === 'activityGraph') && this.state.activities.map(activity => (
                                                    <Button 
                                                        mode={'contained'}
                                                        compact={ true }
                                                        style={{ ...gstyles.COMPACT_BTN }}
                                                        color={ this.state.selectedActivity.value === activity.value ? this.state.randomColor : this.state.dashboardIconsColors }
                                                        onPress={ () => {
                                                            this.setState({ selectedActivity: this.state.activities.filter(o => o.value === activity.value )[0], tappedActivityMoodName: '' }, () => {
                                                                this.indvidualActivityGraph()
                                                            })
                                                        }}
                                                    >
                                                    { activity.value }
                                                    </Button>
                                                ))
                                            }
                                        </View>
                                    </ScrollView>
                                </View>
                                {
                                    this.state.activityGraph.length > 0 
                                    ?   <View>
                                            <View style={gstyles.HORIZONTAL_ROW}>
                                                <Text style={{ flex: 0.25, fontSize: 15 }}>
                                                    Change chart curve to
                                                </Text>
                                                <View style={{ ...gstyles.HORIZONTAL_ROW, flex: 0.75}}>
                                                    <Button 
                                                        mode={'contained'}
                                                        style={{ ...gstyles.COMPACT_BTN }}
                                                        color={ this.state.curve === shape.curveStep ? this.state.randomColor : this.state.dashboardIconsColors }
                                                        onPress={() => this.showDifferentChartCurves('curveStep')}
                                                    >
                                                    Steps
                                                    </Button>
                                                    <Button 
                                                        mode={'contained'}
                                                        style={{ ...gstyles.COMPACT_BTN }}
                                                        color={ this.state.curve === shape.curveMonotoneY ? this.state.randomColor : this.state.dashboardIconsColors }
                                                        onPress={() => this.showDifferentChartCurves('monotoneY')}
                                                    >
                                                    Monotone
                                                    </Button>
                                                    <Button 
                                                        mode={'contained'}
                                                        style={{ ...gstyles.COMPACT_BTN }}
                                                        color={ this.state.curve === shape.curveLinear ? this.state.randomColor : this.state.dashboardIconsColors }
                                                        onPress={() => this.showDifferentChartCurves('linear')}
                                                    >
                                                    Linear
                                                    </Button>
                                                    <Button 
                                                        mode={'contained'}
                                                        style={{ ...gstyles.COMPACT_BTN }}
                                                        color={ this.state.curve === shape.curveNatural ? this.state.randomColor : this.state.dashboardIconsColors }
                                                        onPress={() => this.showDifferentChartCurves()}
                                                    >
                                                    Default
                                                    </Button>
                                                </View>
                                            </View>
                                            <ScrollView horizontal={true}>
                                                <View style={{ height: 280, width: 50 * this.state.activityGraph.length, padding: 5 }}>
                                                    <AreaChart
                                                        style={{ height: '99%' }}
                                                        data={this.state.activityGraph}
                                                        yAccessor={({ item }) => item.score}
                                                        xAccessor={({ item }) => item.date }
                                                        yScale={scale.scaleLinear}
                                                        xScale={scale.scaleTime}
                                                        curve={ this.state.curve }
                                                        contentInset={ { left: 10, right: 10, top: 10, bottom: 10 } }
                                                        svg={{ fill: this.state.randomColor2 }}
                                                        numberOfTicks={this.state.activityGraph.length}
                                                    >
                                                        <Grid svg={{ stroke: 'rgba(151, 151, 151, 0.09)' }} belowChart={false} />
                                                        <ChartPoints color="#003F5A" />
                                                    </AreaChart>
                                                </View>
                                            </ScrollView>
                                            <View style={gstyles.HORIZONTAL_ROW}>
                                                <Text style={gstyles.CENTER}>Select an day or tap on the graph for more information</Text>
                                                <View style={gstyles.HORIZONTAL_ROW}>
                                                    {
                                                        (this.state.chartType === 'activityGraph') && this.state.activityGraph.map(item => (
                                                            <Button 
                                                                mode={'contained'}
                                                                compact={ true }
                                                                style={{ ...gstyles.COMPACT_BTN }}
                                                                color={ 
                                                                    this.state.selectedDates.from.format(this.dateUtils.human) === moment(item.date).format(this.dateUtils.human) ?
                                                                    Utils.dashboardTappingColor : Utils.colorBasedOnMood(item.moodName) 
                                                                }
                                                                onPress={ () => activityGraphPointClicking(item) }
                                                            >
                                                            { moment(item.date).format('ddd DD/MM/YY') }
                                                            </Button>
                                                        ))
                                                    }
                                                </View>
                                            </View>
                                        </View>
                                    : <Text style={gstyles.CENTER}>
                                        {
                                            `No data for ${this.state.selectedActivity.value} from ${this.state.dates.date.from.format('DD/MM/YYYY')} til ${this.state.dates.date.to.format('DD/MM/YYYY')}`
                                        }
                                      </Text>

                                }
                            </View>

        // noData view component is used when there is no data however there is strange bug that happens in charts even though
        // chartData is empty - this works as expected when small data but with larger data set empty data set causes it to break
        if (this.state.chartData.length > 0 || this.state.chartType === 'moodCalendar' || this.state.chartType === 'activityGraph') {
            switch(this.state.chartType) {
                case 'piechart': return pieChart
                case 'barchart': return barChart
                case 'stackedbarchart': return this.state.stackedBarChart ? stackedBarChart : lineChart
                case 'moodCalendar': return moodCalendar
                case 'activityGraph': return activityGraph
            }
        } else return whenNoData

    }

    showDifferentChartCurves = curveType => {
        let curve
        switch(curveType){
            case 'curveStep': curve = shape.curveStep
                              break  
            case 'monotoneY': curve = shape.curveMonotoneY
                              break
            case 'linear': curve = shape.curveLinear
                           break 
            default: curve = shape.curveNatural
        }
        this.setState({ curve })
    }

    renderMoodActivityProgress = ({item}) => (
        <View style={{...gstyles.HORIZONTAL_ROW, flex: 1, marginTop: 5}}>
            <Text style={{ flex: 0.65 }}>
                {item.name} for { this.humanTime(item.mins) }
            </Text>
            <ProgressCircle
                animate={true}
                style={ { height: 50, flex: 0.35 } }
                progress={ item.value }
                progressColor={ item.isMood ? Utils.colorBasedOnMood(item.name) : Utils.randomColors.random() }
            />
        </View> 
    )

    onSwipe(gestureName) {
        const {SWIPE_LEFT, SWIPE_RIGHT} = swipeDirections;

        if ( gestureName === SWIPE_LEFT || gestureName === SWIPE_RIGHT) {
            if (!this.state.alltime && this.state.chartType !== 'stackedbarchart' && this.state.chartType !== 'moodCalendar' && this.state.chartType !== 'activityGraph') {
                this.setState({ tappedActivityMoodName: '' })
                this.showDashboardForEachRange(gestureName)
            }
        }
    }

    showDashboardForEachRange = swipeDirection => {
        let method = swipeDirection === swipeDirections.SWIPE_LEFT ? 'add' : 'subtract'

        let change = this.state.dates.unit === 'hy' ? 5 : this.state.dates.change
        let unit = this.state.dates.unit === 'hy' ? 'M' : this.state.dates.unit

        // console.log('the date state before swipe:', this.state.dates, swipeDirection)
        this.state.dates.date.from[method](change, unit)
        this.state.dates.date.to[method](change, unit)
        this.setState({ dates: this.state.dates, tappedActivityMoodName: '', randomColor2: Utils.randomColors.random() })
        // console.log('the date state after swipe:', this.state.dates)

        this.showDashboardOnDropdown(this.state.chartTypeDropdownsSelected)
    }

    showDashboardOnDropdown = dropdown => {
        console.log(dropdown, 'dropdown')
        this.setState({ chartTypeDropdownsSelected: dropdown, tappedActivityMoodName: '' }, () => {
            // puts the selected dropdown at the last item
            this.chartTypeDropdowns.push(
                this.chartTypeDropdowns.splice(
                    this.chartTypeDropdowns.indexOf( 
                        this.chartTypeDropdowns.filter(o => o.value === dropdown )[0]
                    ), 
                1)[0]
            )

            switch (dropdown){
                case 'Total sum of Activities': this.totalSumActivitiesDashboard()
                                                       break;
                case 'Sum of Activities by Mood': this.moodSumActivitiesDashboard()
                                                       break;
                case 'Moods across the days': this.moodSumByEachDay()
                                                       break;
                case 'Mood calendar': this.moodCalendar() 
                                                       break; 
                case 'Activity graph': this.indvidualActivityGraph()
                                                        break;
            }
        })
    }

    componentDidMount(){
        Utils.orientation.allowBoth()
        this.props.navigation.addListener('willFocus', () => {
            Utils.orientation.allowBoth()
        });
    }

    render() {

        return (
            <ScrollView style={{...gstyles.MAIN_VIEW, backgroundColor: themes[themes.current].colors.background, }}>
                <StatusBar backgroundColor={themes[themes.current].colors.background} />
                <Spinner
                    visible={this.state.isLoading}
                    textContent={'Loading...'}
                    textStyle={{ color: invert(themes[themes.current].colors.background) }}
                    color={Utils.randomColors.random()}
                    cancelable={true}
                    animation='fade'
                    size='large'
                />
                <View style={{ flex: 0.30 }}>

                    <View style={gstyles.HORIZONTAL_ROW}>
                        {
                            this.chartTypeDropdowns.map( obj => (
                                <FAB
                                    icon={ obj.icon }
                                    // color={  }
                                    small={true}
                                    style={{ margin: 3, backgroundColor: this.state.chartTypeDropdownsSelected === obj.value ? this.state.randomColor : this.state.dashboardIconsColors }}
                                    onPress={ () => this.showDashboardOnDropdown(obj.value) }
                                    label={ this.state.chartTypeDropdownsSelected === obj.value ? obj.value : '' }
                                />
                            ))
                        }
                    </View>
                    <View style={{...gstyles.HORIZONTAL_ROW, display: this.state.chartType === 'moodCalendar' ? 'none' : 'flex' }}>
                        <IconButton
                            icon="arrow-back"
                            size={20}
                            onPress={() => this.showDashboardForEachRange(swipeDirections.SWIPE_RIGHT)}
                        />
                        <Caption style={{alignSelf: 'center', fontWeight: 'bold', fontSize: 12}}>
                            {this.state.dates.date.from.format('DD/MM/YYYY')} til {this.state.dates.date.to.format('DD/MM/YYYY')}
                        </Caption>
                        <IconButton
                            icon="arrow-forward"
                            size={20}
                            onPress={() => this.showDashboardForEachRange(swipeDirections.SWIPE_LEFT)}
                        />
                    </View>
                </View>
                <View style={{ flex: 0.70, marginBottom: 30 }}>
                    <View style={{ display: this.state.chartType === 'moodCalendar' ? 'none' : 'flex', }}>
                        <View style={gstyles.HORIZONTAL_ROW}>
                            {
                                this.dropdown.map( obj => (
                                    <FAB
                                        icon={ obj.icon }
                                        // color={  }
                                        small={true}
                                        style={{ margin: 3, backgroundColor: this.state.selectedTimeFrame === obj.value ? this.state.randomColor : this.state.dashboardIconsColors }}
                                        onPress={ () => this.generateDashbaord(obj.value) }
                                        label={ this.state.selectedTimeFrame === obj.value ? obj.value : '' }
                                    />
                                ))
                            }
                        </View>
                    </View>
                    <View style={{...gstyles.ROWS_SPACEBETWEEN, display: this.state.hideShowMoodColor ? 'none' : 'flex' }}>
                        <View style={gstyles.HORIZONTAL_ROW}>
                            <Text>Show mood colors</Text>
                            <Button 
                                mode={'text'}
                                compact={true}
                                style={{ ...gstyles.COMPACT_BTN }}
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
                    <GestureRecognizer
                        onSwipe={(direction) => this.onSwipe(direction)}
                        config={{
                            velocityThreshold: 0.3,
                            directionalOffsetThreshold: 80
                        }}
                        style={{
                            flex: 1,
                        }}
                    >    
                        <ScrollView style={{ flex: 0.70  }}>
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
                            <View style={{ display: this.state.chartType === 'stackedbarchart' ? 'flex' : 'none'}}>
                                <View style={gstyles.ROWS_SPACEBETWEEN}>
                                    <Text>
                                        {
                                            this.state.stackedBarChart ? 'Stacked Bar chart' : 'Stacked Line chart'
                                        }
                                    </Text>
                                    <Switch
                                        value={this.state.stackedBarChart}
                                        onValueChange={() => {
                                            this.setState({ 
                                                stackedBarChart: !this.state.stackedBarChart, 
                                            })
                                        }}
                                    />
                                </View>
                                <View style={gstyles.ROWS_SPACEBETWEEN}>
                                    <Text>
                                        {
                                            this.state.showAllDates ? 'Show all dates' : 'Show relevant dates'
                                        }
                                    </Text>
                                    <Switch
                                        value={this.state.showAllDates}
                                        onValueChange={() => {
                                            Snackbar.show({ title: `Upon loading new data, the changes will be applied then`, duration: Snackbar.LENGTH_LONG })
                                            this.setState({ 
                                                showAllDates: !this.state.showAllDates, 
                                            })
                                        }}
                                    />
                                </View>
                            </View>
                            <View style={{ 
                                display: this.state.chartType === 'piechart' || this.state.chartType === 'moodCalendar' ? 'flex' : 'none'
                                }}>
                                <View style={gstyles.ROWS_SPACEBETWEEN}>
                                    <Text>
                                        Show this data for tags instead
                                    </Text>
                                    <Switch
                                        value={this.state.showTagsData}
                                        onValueChange={() => {
                                            this.setState({ 
                                                showTagsData: !this.state.showTagsData, 
                                            }, () => {
                                                this.showDashboardOnDropdown(this.state.chartTypeDropdownsSelected)
                                            })
                                            console.log(' tags in', this.state.showTagsData)
                                        }}
                                    />
                                </View>
                            </View>
                            <View style={{ display: this.state.progress >= 1 || this.state.progress === 0 ? 'none' : 'flex' }}>
                                <ProgressBar 
                                    progress={ this.state.progress } 
                                    color={Utils.randomColors.random()}
                                    style={{ borderRadius: 8, height: 10, width: 5 }}
                                />
                            </View>
                            <this.showActivitySumData />
                        </ScrollView>
                    </GestureRecognizer>
                    <View style={{ flex: 0.30, display: this.state.tappedActivityMoodName === '' ? 'none' : 'flex' }}>
                        <View style={gstyles.CENTER}>
                            <Caption style={{ fontSize: 20,}}>{this.state.tappedActivityMoodName}</Caption>
                            <Caption>
                                {this.state.selectedDates.from.format(this.dateUtils.human)} - {this.state.selectedDates.to.format(this.dateUtils.human)} 
                            </Caption>
                        </View>
                        <FlatList 
                            data={this.state.dashboardActivitiesSumMoods}
                            renderItem={this.renderMoodActivityProgress}
                            extraData={this.state}
                        />
                    </View>
                </View>
            </ScrollView>
        );
    }
}

