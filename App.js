
import React, {Component} from 'react';
import {
  BackHandler,
  Alert,
  View,
  Text,
  ActivityIndicator,
  NativeModules,
  StatusBar,
} from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import FlashMessage, { showMessage } from "react-native-flash-message";
import MainApp from './src/index'

import theme from './src/components/theme'
import RNRestart from 'react-native-restart';
import {setJSExceptionHandler} from 'react-native-exception-handler';

import Utils from './src/logic/Utils';
import styles from './src/components/styles';
NativeModules.ExceptionsManager = null; //hides stupid red screen of death


const errorHandler = (e, isFatal) => {
  if (isFatal) {

    Alert.alert(
      'Unexpected error occurred',
      `\n\nOpps! Appologies! Tap here to get rid of it\n\nDetailed account of error:\nName: ${e.name}\nMessage: ${e.message}`,
      [{
        text: 'Get rid of it',
        onPress: () => {
          RNRestart.Restart();
        }
      }],
      { cancelable: false }
      );
    } else {
      console.log(e, 'Non fatal '); // So that we can see it in the ADB logs in case of Android if needed
    }
  };

setJSExceptionHandler(errorHandler, true);

const backgroundColor = Utils.randomColors.random()
const SplashScreen = <View style={{ backgroundColor: backgroundColor, height: '100%' , width: '100%', ...styles.CENTER }}>
                        <StatusBar backgroundColor={backgroundColor} />
                        <Text style={{ ...styles.CENTER, fontSize: 30, color: Utils.randomColors.random()}}>Welcome.</Text>
                        <Text style={{ ...styles.CENTER, fontSize: 30, color: Utils.randomColors.random()}}>أهلاً و سهلاً</Text>
                        <Text style={{ ...styles.CENTER, fontSize: 30, color: Utils.randomColors.random()}}> خوش آمديد</Text>
                        <Text style={{ ...styles.CENTER, fontSize: 30, color: Utils.randomColors.random()}}>Willkommen.</Text>
                        <Text style={{ ...styles.CENTER, fontSize: 30, color: Utils.randomColors.random()}}>Bienvenue.</Text>
                        <ActivityIndicator size="large" color={ Utils.randomColors.random() } />
                    </View>

export default class App extends Component {

    constructor(props){
        super(props)
        this.state = {
            themeLoaded: false
        }
    }

    async componentDidMount() {

        let savedTheme = await theme.getTheme()
        theme.current = savedTheme ? savedTheme.current : theme.current
        Utils.sleep(1).then( res => this.setState({ themeLoaded: true }) )
    
    }



    render() {
        // the main app cannot be used the same way as SplashScreen because it 
        // will then be initialised then with the value even though it will not
        // render so to only initialise and render when have correct value as 
        // in theme set then it has to be done like this
        if (this.state.themeLoaded) {
            const AppWithNavigation = MainApp.mainNavigation( theme.current )
            return (
                        <PaperProvider theme={theme[theme.current]}>
                            <AppWithNavigation />
                            <FlashMessage position="top" />
                        </PaperProvider>
                    )
        } else return SplashScreen

    }

}

