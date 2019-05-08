import React from 'react'
import {ActivityIndicator, ScrollView, StatusBar, View} from 'react-native'
import gstyles from '../../components/styles'
import {showMessage} from 'react-native-flash-message'
import db from '../../logic/db'
import sql from '../../logic/sql'
import {Button, Caption, List, Text,} from 'react-native-paper';
import {Slider} from 'react-native-elements';
import themes from '../../components/theme';
import Utils from '../../logic/Utils';
import RNRestart from 'react-native-restart'; // Import package from node modules
const moment = require('moment');


export default class More extends React.Component {

    constructor() {
        super()
        this.state = {
            isLoading: true,
            activityWarningFeature: true
        }
    }

    componentDidMount = () => {
        let configState = {}
        Utils.orientation.portraitOnly()
        db.run(sql.config).then( result => {
            result.rows.raw().forEach( config => {
                configState[config.key] = parseInt(config.value)
            })
            this.setState({ isLoading: false, ...configState })
        })
        this.props.navigation.addListener('willFocus', () => {
            Utils.orientation.portraitOnly()
        });
    }

    saveConfig = () => {
        this.setState({ isLoading: true })
        db.run(sql.saveConfig, [this.state.numberOfLogsBeforeWarning, 'numberOfLogsBeforeWarning']).then( result => {
            console.log(result, 'after upate')
            this.setState({ isLoading: false })
        })
    }

    changeTheme = theme => {
        if (themes.current !== theme) {
            themes.changeTheme(theme)
            RNRestart.Restart()
        } else showMessage({ message: `Already on ${theme} theme. No need to apply.` })
    }


    render() {
        return (
            <ScrollView style={{...gstyles.MAIN_VIEW, backgroundColor: themes[themes.current].colors.background }}>
                <StatusBar backgroundColor={themes[themes.current].colors.background} />
                <View style={{ flex: 0.30}}>
                    <List.Item
                        style={gstyles.LIST_ITEM}
                        title={'Activity warning feature'}
                        // right={() => 
                        //     <Switch 
                        //         value={this.state.activityWarningFeature}
                        //         onValueChange={() => this.setState({ activityWarningFeature: !this.state.activityWarningFeature })}
                        //     />
                        // }
                    />
                    <View style={{ display: this.state.activityWarningFeature ? 'flex' : 'none' }}>
                        <View style={gstyles.HORIZONTAL_ROW}>
                            <View style={{ flex: 0.8 }}>
                                <Text>To look back {this.state.numberOfLogsBeforeWarning} logs</Text>
                                <Caption>
                                    Number of logs to count with either `Sad` or `Angry` associated moods before warning on starting such activity.
                                </Caption>
                            </View>
                            <Slider 
                                style={{ flex: 0.2 }}
                                value={this.state.numberOfLogsBeforeWarning}
                                orientation='vertical'
                                onValueChange={v => this.setState({ numberOfLogsBeforeWarning: v })}
                                minimumValue={2}
                                step={1}
                                maximumValue={10}
                            />
                        </View>
                        <Button 
                            icon="save" 
                            mode="outlined"
                            style={{alignSelf: 'center', width: 90, borderRadius: 10}}
                            onPress={this.saveConfig}
                        >
                            Save
                        </Button>
                    </View>
                    <View style={{...gstyles.HORIZONTAL_ROW, marginTop: 10,}}>
                        <Text style={{ flex: 0.25, fontSize: 15 }}>
                            Theme
                        </Text>
                        <View style={{ ...gstyles.HORIZONTAL_ROW, flex: 0.75}}>
                            <Button 
                                mode={'contained'}
                                style={{ marginBottom: 4 }}
                                color={ themes.current === 'light' ? Utils.randomColors.light() : 'white' }
                                onPress={() => this.changeTheme('light') }
                            >
                            Light
                            </Button>
                            <Button 
                                mode={'contained'}
                                style={{ marginBottom: 4 }}
                                color={ themes.current === 'dark' ? Utils.randomColors.dark() : 'white' }
                                onPress={() => this.changeTheme('dark') }
                            >
                            Dark
                            </Button>
                        </View>
                    </View>
                    {/* <List.Item
                        title="Backup settings"
                        description="Backup your data to Google Drive so your data is safe"
                        left={props => <List.Icon {...props} icon="backup" />}
                        right={() => <IconButton 
                            icon='arrow-forward'
                            onPress={() => this.props.navigation.navigate('Backup')}
                        />}
                    /> */}
                    <ActivityIndicator animating={this.state.isLoading} size='large' style={gstyles.ACTIVITY_INDICATOR} />
                </View>
            </ScrollView>
        );
    }
}