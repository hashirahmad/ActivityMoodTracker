import React from 'react'

import {createAppContainer, createBottomTabNavigator, createStackNavigator} from 'react-navigation'
import {Icon} from 'react-native-elements'
import CreateEditActivity from './screens/Activity/CreateEditActivity'


import Dashboard from './screens/Dashboard/Dashboard'


import More from './screens/More/More'


import Timeline from './screens/Timeline/Timeline'


import Home from './screens/Home'
import OneOffConfig from './screens/OneOffConfig';
import Utils from './logic/Utils';
import themes from './components/theme';
import invert from 'invert-color';


const TimelineStack = createStackNavigator({
    Timeline: {
        screen: Timeline,
        navigationOptions: ({ navigation }) => ({
            header: null
        })
    },
})

const HomeStack = createStackNavigator({
    Home: {
        screen: Home,
        navigationOptions: ({ navigation }) => ({
            header: null
        })
    },
    CreateEditActivity: {
        screen: CreateEditActivity,
        navigationOptions: ({ navigation }) => ({
            title: navigation.getParam('title', 'Edit activity'),
            headerStyle: {
                backgroundColor: themes[themes.current].colors.background,
            },
            headerTintColor: invert(themes[themes.current].colors.background)
        })
    },
})

const DashboardStack = createStackNavigator({
    Dashboard: {
        screen: Dashboard,
        navigationOptions: {
            header: null
        }
    }
})

const MoreStack = createStackNavigator({
    More: {
        screen: More,
        navigationOptions: {
            header: null
        },
    },
    // Backup: {
    //     screen: Backup,
    //     navigationOptions: {
    //     }
    // },
    OneOffConfig: {
        screen: OneOffConfig,
        navigationOptions: {
            header: null
        },
    }
})

console.disableYellowBox = true

export default {
    mainNavigation: theme => {
        const Tabs = createBottomTabNavigator({
            Home: { screen: HomeStack },
            Timeline: { screen: TimelineStack },
            Dashboard: { screen: DashboardStack },
            More: { screen: MoreStack },
        }, {
            defaultNavigationOptions: ({ navigation }) => ({
                tabBarIcon: ({ focused, horizontal, tintColor }) => {
                    const { routeName } = navigation.state;
                    let iconsName = {
                        OneOffConfig: null,
                        Home: 'home',
                        Timeline: 'timeline',
                        More: 'settings',
                        Dashboard: 'dashboard',
                    }
                    return <Icon name={iconsName[routeName]} color={tintColor} />
                },
            }),
            tabBarOptions: {
                tabStyle: { backgroundColor: themes[theme].colors.background  },
                style: { borderTopColor: themes[theme].colors.background, },
                activeTintColor: Utils.randomColors.random(),
                inactiveTintColor: theme === 'light' ? Utils.randomColors.dark() : Utils.randomColors.light(),
            },
        })
        return createAppContainer(Tabs) 
    }
}