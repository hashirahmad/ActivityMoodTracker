import {DarkTheme, DefaultTheme,} from 'react-native-paper';
import Utils from '../logic/Utils';

let changeTheme = theme => {

    switch(theme){
        case 'light': 
            themes.default = {
                ...DefaultTheme,
                roundness: 5,
                dark: false,
                colors: {
                    ...DefaultTheme.colors,
                }
            }
            break
        case 'dark':
            themes.default = {
                ...DarkTheme,
                roundness: 5,
                dark: true,
                colors: {
                    ...DarkTheme.colors,
                }
            }
            break
    }
    themes.current = theme
    Utils.storage.save('THEME', themes, true)

}

let getTheme = async () => {
    let theme = await Utils.storage.get('THEME', true)
    return theme === 'NO_KEY' ? null : theme
}

let themes = {
    default: {
        ...DarkTheme,
        roundness: 5,
        dark: true,
        colors: {
            ...DarkTheme.colors,
        }
    },
    dark: {
        ...DarkTheme,
        roundness: 5,
        dark: true,
        colors: {
            ...DarkTheme.colors,
        }
    }, 
    light: {
        ...DefaultTheme,
        roundness: 5,
        dark: false,
        colors: {
            ...DefaultTheme.colors,
        }
    },
    changeTheme,
    getTheme,
    current: 'light'
}

export default themes
