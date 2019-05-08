import React from 'react'
import {View} from 'react-native'

export default class Header extends React.Component {
    render() {
        return (
            <View style={{ height: 40, backgroundColor: this.props.color }} />
        );
    }
}