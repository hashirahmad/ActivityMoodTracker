import React from 'react'
import {StyleSheet} from 'react-native'

export default StyleSheet.create({
    MAIN_VIEW: {
        // paddingTop: 25,
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 5,
        flex: 1,
        // backgroundColor: themes.default.colors.background
    },
    FAB: {
        position: 'absolute',
        margin: 5,
        right: 0,
        bottom: 0,
    },
    LIST_ITEM: {
        padding: 0,
        margin: 0,
    },
    HORIZONTAL_ROW: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignSelf: 'center',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    CENTER: {
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center'
    },
    ROUNDED: {
        borderRadius: 12,
        borderWidth: 0.2,
        borderColor: 'gray'
    },
    IMAGE_TRANSPARENT: {
        opacity: 0.30, 
        resizeMode: 'center', 
    },
    ROWS_SPACEBETWEEN: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    TRANSPARENT_TEXTINPUT: {
        backgroundColor: '#00000000'
    },
    COMPACT_BTN: {
        height: 36,
        borderRadius: 12,
        margin: 3, 
        alignSelf: 'center'
    }
})