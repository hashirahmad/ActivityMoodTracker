import React from 'react'
import {
    Button,
    Caption,
    Chip,
    Colors,
    Dialog,
    FAB,
    IconButton,
    Portal,
    Switch,
    Text,
    TextInput,
    TouchableRipple
} from 'react-native-paper';
import {FlatList, ScrollView, StatusBar, StyleSheet, View} from 'react-native'
import * as moment from 'moment';
import gstyles from '../../components/styles'
import db from '../../logic/db'
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import TagsLogic from '../../logic/TagsRelated'
import TimePicker from "react-native-24h-timepicker";
import Utils from '../../logic/Utils'
import {showMessage} from 'react-native-flash-message'
import sql from '../../logic/sql';
import {Slider} from 'react-native-elements'
import themes from '../../components/theme';
import Snackbar from 'react-native-snackbar';

export default class CreateEditActivity extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            activityName: '',
            groupId: '',
            groupName: '',
            isDailyGoal: true,
            goalCaption: 'Daily goal',
            goalHours: '0',
            goalMins: '0',
            goalError: false,
            setGoals: false,
            setTags: false,
            showTagsDialog: false,
            showEditGroupDialog: false,
            tags: [],
            activityBeingSaved: false,
            saveButtonDisable: true,
            activitySelectedTags: [],
            activities: [],
            shouldNavigateBack: false,
            habitCaption: 'Bad habit',
            isBadHabit: true,
            setHabit: false, 
            habitIncDecAmount: 0,
            habitAverageHours: '0',
            habitAverageMins: '0',
            habitAverageLookBackMonths: 3
        }
        this.activitySelectedTags = []
    }

    onChangeText = (key, value) => {
        this.setState({
            [key]: value,
            saveButtonDisable: value === ''
        })
    }
    setGoals = () => {
        this.setState({ 
            setGoals: !this.state.setGoals,
        })
    }

    setStateAccordingToPreviousActivityOrNot = () => {
        let old = this.oldActivity
        if (old) {
            TagsLogic.getTags(old).then( result => {
                this.setState({ 
                    activitySelectedTags: result.tags,
                    setTags: result.tags.length > 0
                })

            })
        }
        this.setState({
            activityName: old ? old.activityName : '',
            isDailyGoal: old ? old.goalType === 'DAILY' || old.goalType === 'N/A' : true,
            goalCaption: old ? old.goalType === 'DAILY' || old.goalType === 'N/A' ? 'Daily goal' : 'Weekly goal' : 'Daily goal',
            maxHour: old ? old.goalType === 'DAILY' ? 15 : 40 : 15,
            goalHours: old ? moment.duration(old.goalLength)._data.hours.toString() : '0',
            goalMins: old ? moment.duration(old.goalLength)._data.minutes.toString() : '0',
            habitAverageHours: old ? moment.duration(old.habitAverageLength)._data.hours.toString() : '0',
            habitAverageMins: old ? moment.duration(old.habitAverageLength)._data.minutes.toString() : '0',
            habitAverageLookBackMonths: old ? old.habitAverageLookBackMonths : 3,
            goalError: false, 
            setGoals: old ? old.goalType !== 'N/A' : false,
            saveButtonDisable: this.state.activityName === '',
            setHabit: old ? old.habitType !== 'N/A' : false,
            isBadHabit: old ? old.habitType === 'BAD' || old.habitType === 'N/A' : true,
            habitCaption: old ? old.habitType === 'BAD' || old.habitType === 'N/A' ? 'Bad habit' : 'Good habit' : 'Bad habit',
            habitIncDecAmount: old ? old.habitIncDecByMins : 0,
            habitAverageLength: old ? old.habitAverageLength : 0
        })
    }

    componentDidMount = () => {
        Utils.orientation.portraitOnly()
        this.props.navigation.addListener('willFocus', () => {
            Utils.orientation.portraitOnly()
        });
        this.oldActivity = this.props.navigation.getParam('activity')
        this.setTagsInState()
        this.setActivitiesInState()
        this.setStateAccordingToPreviousActivityOrNot()
    }
    setTagsInState = () => {
        TagsLogic.getTags().then( result => {
            for (i in result.tags) { result.tags[i].selected = false }
            this.setState({ tags: result.tags })
        }).catch( err => {
            console.log(err)
            showMessage({
                message: `There was an error with retrieving of tags. heres the error: ${err}`,
                type: 'warning',
                autoHide: false
            });
        })
    }

    setActivitiesInState = () => {
        db.run(sql.activities.join(' ')).then( result => {
            this.setState({ activities: result.rows.raw() })
        }).catch( err => {
            showMessage({
                message: `There was an error with getting of Activities heres the error: ${err}`,
                type: 'warning',
                autoHide: false
            });
        })
    }

    // Its used for when selecting/unselecting a tag during setting of tags for new activity
    selectUnselectTagForActivity = tag => {
        let allTags = this.state.tags
        let selectedTagIndex = allTags.indexOf(tag)
        allTags[selectedTagIndex].selected = !tag.selected
        if (tag.selected) this.activitySelectedTags.push(tag)
        else this.activitySelectedTags.splice( this.activitySelectedTags.indexOf(tag) )
        this.setState({ tags: allTags, activitySelectedTags: this.activitySelectedTags })
        console.log(this.state.activitySelectedTags, 'state has been set')
    }
    showTags = ({item}) => {
        console.log(item, 'its me...')
        return(
            <Chip style={{marginBottom: 10}}>
                {item.key}
            </Chip>
        )
    }
        
    renderTagsInDialog = () => {
        chipTags = []
        this.state.tags.map( tag => {
            chipTags.push(
                <Chip 
                    key={tag.id}
                    selected={tag.selected}
                    style={{ marginBottom: 10, marginRight: 10}}
                    onPress={() => this.selectUnselectTagForActivity(tag)}
                >
                    {tag.key}
                </Chip>
            )
        })
        return (chipTags)
    }
    saveActivity = () => {

        // if (Utils.isDuplicateOrEmpty(this.state.activityName, this.state.activities, 'activityName')) {
        //     showMessage({
        //         message: `Activity name cannot be left empty or be a duplicate`,
        //         type: 'info',
        //     });
        //     return
        // }

        this.setState({ activityBeingSaved: true })
        let goalLength = moment.duration({ hours: this.state.goalHours, minutes: this.state.goalMins })._milliseconds
        let habitAverageLength = moment.duration({ hours: this.state.habitAverageHours, minutes: this.state.habitAverageMins })._milliseconds

        if (this.oldActivity) {

            db.run(sql.updateActivity.join(' '), [
                this.state.activityName,
                goalLength,
                this.state.setGoals ? this.state.isDailyGoal ? 'DAILY' : 'WEEKLY' : 'N/A',
                this.state.setHabit ? this.state.isBadHabit ? 'BAD' : 'GOOD' : 'N/A',
                this.state.habitIncDecAmount,
                habitAverageLength,
                this.state.habitAverageLookBackMonths,
                this.oldActivity.activityId
            ]).then(result => {
                showMessage({
                    message: `${this.state.activityName} saved successfully.`,
                    type: 'success'
                })
                this.setState({ activityBeingSaved: false })
                if (this.oldActivity) this.props.navigation.goBack()
            }).catch( err => {
                this.setState({ 
                    activityBeingSaved: false,
                })
                showMessage({
                    message: `Error occured while trying to save activity. Heres the error: ${err}`,
                    type: 'danger',
                    autoHide: false
                });
            })

        } else {
            let insertSQL = 'INSERT INTO "Activity" (activityName, groupId, goalLength, goalType, habitType, habitIncDecByMins, habitAverageLength, habitAverageLookBackMonths)'
            insertSQL += ' values (?, ?, ?, ?, ?, ?, ?, ?)'
    
            db.run(insertSQL, [
                this.state.activityName,
                0,
                goalLength,
                this.state.setGoals ? this.state.isDailyGoal ? 'DAILY' : 'WEEKLY' : 'N/A',
                this.state.setHabit ? this.state.isBadHabit ? 'BAD' : 'GOOD' : 'N/A',
                this.state.habitIncDecAmount,
                habitAverageLength,
                this.state.habitAverageLookBackMonths
            ]).then( result => {
    
                if (this.state.setTags) {
                    for (i in this.state.activitySelectedTags) {
                        let insertSQL = 'INSERT INTO "ActivityTag" (activityId, tagId) values (?,?)'
                        let tag = this.state.activitySelectedTags[i]
                        db.run(insertSQL, [ result.insertId, tag.id ] )
                    }
                }
    
                showMessage({
                    message: `${this.state.activityName} saved successfully.`,
                    type: 'success'
                })
    
                this.setState({ 
                    activityBeingSaved: false,
                    activityName: '',
                    setGoals: false,
                    goalMins: 0,
                    goalHours: 0,
                    habitAverageHours: 0,
                    habitAverageMins: 0,
                    setTags: false,
                    saveButtonDisable: true,
                    activitySelectedTags: [],
                    habitIncDecAmount: 0,
                    habitAverageLength: 0,
                    setHabit: false,
                    habitAverageLookBackMonths: 3,
                    isBadHabit: true
                })
    
            }).catch( err => {
                this.setState({ 
                    activityBeingSaved: false,
                })
                showMessage({
                    message: `Error occured while trying to save activity. Heres the error: ${err}`,
                    type: 'danger',
                    autoHide: false
                });
            })
        }

    }
    // allowValidGoals = (val, maxVal, key) => {
    //     if (val === "") {
    //         this.setState({ [key]: '0' })
    //     } else {
    //         val = parseInt(val)

    //         if (this.state.isDailyGoal) {
    //             maxVal = key === 'goalHours' ? 17 : maxVal
    //         }

    //         if (val > maxVal) {
    //             this.setState({ 
    //                 goalError: true,
    //                 saveButtonDisable: true,
    //                 [key]: maxVal.toLocaleString(),
    //             })
    //         } else {
    //             this.setState({
    //                 goalError: false,
    //                 saveButtonDisable: false,
    //                 [key]: parseInt(val).toLocaleString()
    //             })
    //         }   
    //     }
    // }

    showTagsOnlyInCreateMode = () => {
        let tagsView = 
            <View style={gstyles.ROWS_SPACEBETWEEN}>
                <Text>Tags</Text>
                <Switch
                    value={this.state.setTags}
                    onValueChange={() => {
                        if (!this.state.setTags) {
                            // for (i in this.state.tags) this.state.tags[i].selected = false
                            console.log(this.oldActivity, !this.oldActivity)
                            if (!this.oldActivity) {
                                for (i in this.state.tags) this.state.tags[i].selected = false
                                this.setState({ activitySelectedTags: [] })
                                this.activitySelectedTags = []
                            } 
                        }
                        this.setState({
                            showTagsDialog: !this.state.setTags, 
                            setTags: !this.state.setTags,
                        })
                    }}
                />
            </View>
        
        let tagsViewInOldActivity = 
            <View style={{ ...gstyles.CENTER, marginBottom: 10, marginTop: 10 }}>
                <Caption>
                    New tags cannot be added or deleted. 
                    This feature is not yet supported. 
                    For now please delete and recreate the activity with desired tags
                </Caption>
            </View>
        
        return this.oldActivity ? tagsViewInOldActivity : tagsView
    }

    renderCreateTags = () => (
        <KeyboardAwareScrollView style={{marginTop: 20}} contentContainerStyle={gstyles.HORIZONTAL_ROW}>
            <TextInput
                label='Add a tag'
                value={this.state.createTag}
                style={{flex: 0.80, marginRight: 10, ...gstyles.TRANSPARENT_TEXTINPUT}}
                onChangeText={ val => this.setState({ createTag: val }) }
            />
            <FAB
                small
                icon="add"
                onPress={() => {
                    this.addTag()
                }}
            />
        </KeyboardAwareScrollView>
    )

    addTag = () => {
        if ( this.state.createTag === '' ||
             this.state.tags.find( obj => obj.tagName === this.state.createTag) !== undefined ) {
                 showMessage({
                     message: 'Tag name cannot be left empty or be a duplicate',
                     type: 'warning',
                     autoHide: false
                 })
            return
        }

        db.run("INSERT INTO 'Tag' (tagName) VALUES (?)", [this.state.createTag]).then( result => {
            if (result.rowsAffected > 0) {
                this.setTagsInState()
                showMessage({
                    message: `${this.state.createTag} was added successfully`,
                    type: 'success'
                })
            }
        }).catch( err => showMessage({
            message: `${this.state.createTag} was not added properly. Here's the error: ${err}`,
            type: 'warning',
            autoHide: false
        }))
    }

    updateTime = (h, m) => {
        this.setState({ goalHours: h, goalMins: m, saveButtonDisable: this.state.activityName === '' })
        this.TimePicker.close()
    }

    updateTimeForHabiit = (h, m) => {
        this.setState({ habitAverageHours: h, habitAverageMins: m, saveButtonDisable: this.state.activityName === '' })
        this.habitAverage.close()
    }

    renderDeleteActivity = () => {
        let deleteFAB =
            <FAB
                small
                icon="delete-forever"
                style={gstyles.FAB}
                onPress={() => {
                    db.run(sql.deleteActivity, [this.oldActivity.activityId]).then( result => {
                        showMessage({
                            message: `${this.oldActivity.activityName} has been deleted successfully`,
                            type: 'success'
                        })
                        this.props.navigation.goBack()
                    })
                }}
            />            
        
        return this.oldActivity ? deleteFAB : null
    }

    render() {
        return(
            <View style={{...gstyles.MAIN_VIEW, backgroundColor: themes[themes.current].colors.background }}>
                <StatusBar backgroundColor={themes[themes.current].colors.background} />
                <KeyboardAwareScrollView style={{ flex: this.oldActivity ? 0.99 : 1}}>
                    <TextInput
                        label='Add activity name'
                        value={this.state.activityName}
                        onChangeText={ val => this.onChangeText('activityName', val)}
                        style={{ flex: 0.85, marginBottom: 10, ...gstyles.TRANSPARENT_TEXTINPUT }}
                    />
                    <View style={gstyles.ROWS_SPACEBETWEEN}>
                        <Text>Set goals</Text>
                        <Switch
                            value={this.state.setGoals}
                            onValueChange={() => {
                                if (this.oldActivity) this.setState({ saveButtonDisable: false })
                                this.setState({ 
                                    setGoals: !this.state.setGoals,
                                    goalHours: this.state.setGoals ? this.state.goalHours : 0,
                                    goalMins: this.state.setGoals ? this.state.goalMins : 0,
                                })
                            }}
                        />
                    </View>
                    <View style={{display: this.state.setGoals ? 'flex' : 'none'}}>
                        <View style={gstyles.ROWS_SPACEBETWEEN}>
                            <Text>{this.state.goalCaption}</Text>
                            <Switch
                                value={this.state.isDailyGoal}
                                onValueChange={() => {
                                    let goalHours
                                    this.setState({ 
                                        isDailyGoal: !this.state.isDailyGoal,
                                        maxHour: !this.state.isDailyGoal ? 15 : 40,
                                        goalHours: !this.state.isDailyGoal ? this.state.goalHours > 15 ? 15 : this.state.goalHours : this.state.goalHours,
                                        goalCaption: !this.state.isDailyGoal ? 'Daily Goal' : 'Weekly Goal'
                                    })
                                }}
                            />
                        </View>
                        <View>
                            <TouchableRipple 
                                style={{...gstyles.HORIZONTAL_ROW, borderRadius: 40, padding: 10, }}
                                rippleColor="rgb(238, 159, 159)"
                                borderless={true}
                                onPress={() => this.TimePicker.open()}
                            >
                                <View style={gstyles.HORIZONTAL_ROW}>
                                    <Text style={{ fontSize: 60 }}>
                                        {this.state.goalHours}
                                    </Text>
                                    <Text style={{ fontSize: 30, marginBottom: -20, marginRight: 20 }}>
                                        h
                                    </Text>
                                    <Text style={{ fontSize: 60 }}>
                                        {this.state.goalMins}
                                    </Text>
                                    <Text style={{ fontSize: 30, marginBottom: -20, marginRight: 20 }}>
                                        m
                                    </Text>
                                </View>
                            </TouchableRipple>
                        </View>
                    </View>
                    { this.showTagsOnlyInCreateMode() }
                    <View style={{ display: this.state.setTags ? 'flex' : 'none' }}>
                        <FlatList
                            renderItem={this.showTags}
                            data={this.state.activitySelectedTags}
                            extraData={this.state}
                            contentContainerStyle={gstyles.HORIZONTAL_ROW}
                        />
                    </View>
                    <View style={gstyles.ROWS_SPACEBETWEEN}>
                        <Text>Is this a habit</Text>
                        <Switch
                            value={this.state.setHabit}
                            onValueChange={() => {
                                if (this.oldActivity) this.setState({ saveButtonDisable: false })
                                this.setState({ 
                                    setHabit: !this.state.setHabit,
                                    habitIncDecAmount: !this.state.setHabit ? 0 : this.state.habitIncDecAmount,
                                })
                            }}
                        />
                    </View>
                    <View style={{ display: this.state.setHabit ? 'flex' : 'none' }}>
                        <View style={gstyles.ROWS_SPACEBETWEEN}>
                            <Text>{this.state.habitCaption}</Text>
                            <Switch
                                value={this.state.isBadHabit}
                                onValueChange={() => {
                                    this.setState({ 
                                        isBadHabit: !this.state.isBadHabit,
                                        habitCaption: !this.state.isBadHabit ? 'Bad habit' : 'Good habit'
                                    })
                                }}
                            />
                        </View>
                        <View style={{...gstyles.ROWS_SPACEBETWEEN, flex: 1}}>
                            <Text style={{flex: 0.70}}>
                                Increase/Decrease by {this.state.habitIncDecAmount} mins
                            </Text>
                            <View style={{...gstyles.ROWS_SPACEBETWEEN, flex: 0.30}}>
                                <IconButton 
                                    icon={'exposure-plus-1'}
                                    color={this.state.isBadHabit ? Colors.red500 : Colors.green500}
                                    onPress={() => {
                                        if (this.oldActivity) this.setState({ saveButtonDisable: false })
                                        this.setState({ 
                                            habitIncDecAmount: ++this.state.habitIncDecAmount,
                                        })
                                        console.log(this.state.habitIncDecAmount, 'your value +1')
                                    }}
                                />
                                <IconButton 
                                    icon={'exposure-neg-1'}
                                    color={this.state.isBadHabit ? Colors.green500 : Colors.red500 }
                                    onPress={() => {
                                        if (this.oldActivity) this.setState({ saveButtonDisable: false })
                                        this.setState({ 
                                            habitIncDecAmount: this.state.habitIncDecAmount === 0 ? 0 : --this.state.habitIncDecAmount,
                                        })
                                        console.log(this.state.habitIncDecAmount, 'your value -1')
                                    }}
                                />
                            </View>
                        </View>
                        <View style={{...gstyles.ROWS_SPACEBETWEEN, flex: 1}}>
                            <Text style={{ flex: 0.50 }}>Remind me until average duration in mins is:</Text>
                            <View style={{ flex: 0.50, ...gstyles.CENTER }}>
                                <TouchableRipple 
                                    style={{...gstyles.HORIZONTAL_ROW, borderRadius: 40, padding: 10, marginTop: -12}}
                                    rippleColor="rgb(238, 159, 159)"
                                    borderless={true}
                                    onPress={() => this.habitAverage.open()}
                                >
                                    <View style={gstyles.HORIZONTAL_ROW}>
                                        <Text style={{ fontSize: 30 }}>
                                            {this.state.habitAverageHours}
                                        </Text>
                                        <Text style={{ fontSize: 15, marginBottom: -15, marginRight: 5 }}>
                                            h
                                        </Text>
                                        <Text style={{ fontSize: 30 }}>
                                            {this.state.habitAverageMins}
                                        </Text>
                                        <Text style={{ fontSize: 15, marginBottom: -15, marginRight: 5 }}>
                                            m
                                        </Text>
                                    </View>
                                </TouchableRipple>
                            </View>
                        </View>
                        <View style={gstyles.HORIZONTAL_ROW}>
                            <View style={{ flex: 0.8 }}>
                                <Text>To look back {this.state.habitAverageLookBackMonths} months</Text>
                                <Caption>
                                    This is the number of months the average duration of an activity will be based upon. 
                                    Default value is set to 3 months as a resonable period to look back for
                                </Caption>
                            </View>
                            <Slider 
                                style={{ flex: 0.3 }}
                                value={this.state.habitAverageLookBackMonths}
                                orientation='vertical'
                                onValueChange={v => this.setState({ habitAverageLookBackMonths: v, saveButtonDisable: this.state.activityName === '' })}
                                minimumValue={1}
                                step={1}
                                maximumValue={12}
                            />
                        </View>
                    </View>
                    <Button 
                        icon="save" 
                        mode="outlined"
                        loading={this.state.activityBeingSaved}
                        style={{alignSelf: 'center', width: 90, borderRadius: 10}}
                        disabled={this.state.saveButtonDisable}
                        onPress={this.saveActivity}
                    >
                        Save
                    </Button>
                    <TimePicker
                        ref={ref => {
                            this.TimePicker = ref;
                        }}
                        onCancel={() => this.TimePicker.close()}
                        maxHour={this.state.maxHour}
                        selectedHour={this.state.goalHours}
                        selectedMinute={this.state.goalMins}
                        onConfirm={this.updateTime}
                    />
                    <TimePicker
                        ref={ref => {
                            this.habitAverage = ref;
                        }}
                        onCancel={() => this.habitAverage.close()}
                        maxHour={12}
                        selectedHour={this.state.habitAverageHours}
                        selectedMinute={this.state.habitAverageMins}
                        onConfirm={this.updateTimeForHabiit}
                    />
                    <Portal>
                        <Dialog
                            visible={this.state.showTagsDialog}
                            onDismiss={() => {
                                    this.setState({ showTagsDialog: false })
                                    console.log(this.activitySelectedTags, this.state.activitySelectedTags)
                                }}
                            >
                            <Text>Select all applicable tags</Text>
                            <Dialog.Content>
                                <View style={{height: 300}}>
                                    <ScrollView contentContainerStyle={gstyles.HORIZONTAL_ROW}>
                                        { this.renderTagsInDialog() }
                                    </ScrollView>
                                </View>
                                { this.renderCreateTags() }
                            </Dialog.Content>
                        </Dialog>
                    </Portal>                  
                </KeyboardAwareScrollView>
                <View style={{ flex: this.oldActivity ? 0.01 : 0 }}>
                    { this.renderDeleteActivity() }
                </View>
            </View>
        )
    }

}

const styles =  StyleSheet.create({
    rowSpaceBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    displayTags: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        flexWrap: 'wrap'
    }
})